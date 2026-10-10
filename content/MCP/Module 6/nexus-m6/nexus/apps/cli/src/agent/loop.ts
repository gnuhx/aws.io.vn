import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { LlmError, textOf, type LlmMessage, type LlmProvider } from "../llm/types.ts";
import { callAsLlm, toLlmTool } from "./mcp-tools.ts";

export interface AgentOptions {
  llm: LlmProvider;
  mcp: Client;
  question: string;
  system?: string;
  /** Số lượt gọi LLM tối đa — chặn vòng lặp vô hạn và hóa đơn vô hạn. */
  maxSteps: number;
  /** Tổng số tool call tối đa (1 lượt có thể gọi song song nhiều tool). */
  maxToolCalls?: number;
  /** Host quyết định model được thấy tool nào (mặc định: bỏ tool có destructiveHint). */
  allowTool?: (t: Tool) => boolean;
  maxTokens?: number;
  signal?: AbortSignal;
  onEvent?: (e: AgentEvent) => void;
}

export type AgentEvent =
  | { type: "llm"; step: number; stopReason: string; ms: number; toolUses: number }
  | { type: "tool"; step: number; name: string; input: Record<string, unknown>; isError: boolean; ms: number; chars: number; errorText?: string };

interface Stats {
  steps: number;
  toolCalls: number;
  ms: number;
  usage: { inputTokens: number; outputTokens: number };
}
export type AgentResult =
  | ({ status: "answered"; text: string } & Stats)
  | ({ status: "max_steps" | "max_tool_calls"; lastText: string } & Stats)
  | ({ status: "llm_error"; error: LlmError } & Stats)
  | ({ status: "aborted" } & Stats);

type WithoutStats<T> = T extends unknown ? Omit<T, keyof Stats> : never;

export const noDestructive = (t: Tool): boolean => t.annotations?.destructiveHint !== true || t.annotations.readOnlyHint === true;

/** Vòng lặp tool use: hỏi LLM → LLM xin gọi tool → host gọi qua MCP → đưa kết quả lại → lặp tới khi LLM trả lời hoặc chạm giới hạn. */
export async function runAgent(o: AgentOptions): Promise<AgentResult> {
  const t0 = performance.now();
  const stats: Stats = { steps: 0, toolCalls: 0, ms: 0, usage: { inputTokens: 0, outputTokens: 0 } };
  const done = (r: WithoutStats<AgentResult>): AgentResult => ({ ...r, ...stats, ms: Math.round(performance.now() - t0) });

  const all = (await o.mcp.listTools({}, o.signal ? { signal: o.signal } : {})).tools; // MCP ①: tools/list
  const visible = all.filter(o.allowTool ?? noDestructive);
  const allowed = new Set(visible.map((t) => t.name));
  const tools = visible.map(toLlmTool);
  const messages: LlmMessage[] = [{ role: "user", content: [{ type: "text", text: o.question }] }];
  let lastText = "";

  while (stats.steps < o.maxSteps) {
    if (o.signal?.aborted) return done({ status: "aborted" });
    stats.steps++;
    const s0 = performance.now();
    let res;
    try {
      res = await o.llm.complete({ ...(o.system ? { system: o.system } : {}), messages, tools, maxTokens: o.maxTokens ?? 1024 }, o.signal);
    } catch (e) {
      if (o.signal?.aborted) return done({ status: "aborted" });
      if (e instanceof LlmError) return done({ status: "llm_error", error: e });
      throw e;
    }
    stats.usage.inputTokens += res.usage.inputTokens;
    stats.usage.outputTokens += res.usage.outputTokens;
    const uses = res.content.filter((b) => b.type === "tool_use");
    o.onEvent?.({ type: "llm", step: stats.steps, stopReason: res.stopReason, ms: Math.round(performance.now() - s0), toolUses: uses.length });
    messages.push({ role: "assistant", content: res.content });
    lastText = textOf(res) || lastText;
    if (uses.length === 0) return done({ status: "answered", text: textOf(res) });

    if (o.maxToolCalls !== undefined && stats.toolCalls + uses.length > o.maxToolCalls) return done({ status: "max_tool_calls", lastText });
    stats.toolCalls += uses.length;
    // các tool_use trong 1 lượt độc lập nhau → gọi song song; kết quả giữ đúng thứ tự tool_use
    const results = await Promise.all(
      uses.map(async (u) => {
        const c0 = performance.now();
        const r = await callAsLlm(o.mcp, u, allowed, o.signal); // MCP ②: tools/call
        o.onEvent?.({
          type: "tool",
          step: stats.steps,
          name: u.name,
          input: u.input,
          isError: r.isError,
          ms: Math.round(performance.now() - c0),
          chars: r.content.length,
          ...(r.isError ? { errorText: r.content } : {}),
        });
        return r;
      }),
    );
    messages.push({ role: "user", content: results });
  }
  return done({ status: "max_steps", lastText });
}
