import type { z } from "zod";
import { LlmError, type LlmProvider, type LlmRequest, type LlmResponse } from "./types.ts";

/**
 * Provider GIẢ LẬP thay LLM khi không có API key: chạy 1 kịch bản viết sẵn bằng code.
 * Kịch bản đọc hội thoại (kết quả tool THẬT từ MCP server) như model đọc, rồi quyết định bước kế.
 * Cùng hợp đồng LlmProvider với adapter thật → agent loop và sampling handler không phân biệt được.
 */
export interface ScriptContext {
  req: LlmRequest;
  step: number;
  /** Text của message user cuối (câu hỏi, hoặc request sampling). */
  lastUserText(): string;
  /** Kết quả (JSON.parse + kiểm bằng schema, bỏ kết quả lỗi) của tool này ở LƯỢT GẦN NHẤT có gọi nó, đúng thứ tự gọi. */
  results<T>(tool: string, schema: z.ZodType<T>): T[];
  /** Kết quả gần nhất của 1 tool ở bất kỳ lượt nào. */
  last<T>(tool: string, schema: z.ZodType<T>): T | undefined;
}
export type ScriptReply = { say: string } | { call: { name: string; input: Record<string, unknown> }[] };
export type ScriptStep = (ctx: ScriptContext) => ScriptReply;

function context(req: LlmRequest, step: number): ScriptContext {
  const names = new Map<string, string>(); // tool_use id → tên tool
  for (const m of req.messages) for (const b of m.content) if (b.type === "tool_use") names.set(b.id, b.name);
  const parse = (s: string): unknown => {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      return s;
    }
  };
  const resultsIn = (idx: number, tool: string): unknown[] =>
    (req.messages[idx]?.content ?? []).flatMap((b) =>
      b.type === "tool_result" && !b.isError && names.get(b.toolUseId) === tool ? [parse(b.content)] : [],
    );
  return {
    req,
    step,
    lastUserText() {
      const m = [...req.messages].reverse().find((x) => x.role === "user");
      return (m?.content ?? []).flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
    },
    results<T>(tool: string, schema: z.ZodType<T>) {
      for (let i = req.messages.length - 1; i >= 0; i--) {
        const r = resultsIn(i, tool);
        if (r.length) return r.map((x) => schema.parse(x));
      }
      return [];
    },
    last<T>(tool: string, schema: z.ZodType<T>) {
      const all = this.results(tool, schema);
      return all.at(-1);
    },
  };
}

export function scriptedProvider(name: string, steps: ScriptStep[], opts: { repeatLast?: boolean } = {}): LlmProvider {
  let i = 0;
  return {
    name: `scripted:${name}`,
    async complete(req: LlmRequest, signal?: AbortSignal): Promise<LlmResponse> {
      signal?.throwIfAborted();
      const step = steps[i] ?? (opts.repeatLast ? steps.at(-1) : undefined);
      if (!step) throw new LlmError("script", `kịch bản "${name}" đã hết (${steps.length} bước)`);
      const reply = step(context(req, i));
      i++;
      const model = `scripted/${name}`;
      const usage = { inputTokens: 0, outputTokens: 0 };
      if ("say" in reply) return { model, usage, stopReason: "end_turn", content: [{ type: "text", text: reply.say }] };
      return {
        model,
        usage,
        stopReason: "tool_use",
        content: reply.call.map((c, k) => ({ type: "tool_use" as const, id: `toolu_${i}_${k}`, name: c.name, input: c.input })),
      };
    },
  };
}
