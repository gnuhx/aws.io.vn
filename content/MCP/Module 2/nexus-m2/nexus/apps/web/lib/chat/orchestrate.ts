import type { ChatEvent } from "@nexus/shared";
import type { LlmMessage, LlmProvider, LlmTool, ToolCall, ToolResult } from "../llm/types.ts";

export interface OrchestratorDeps {
  llm: LlmProvider;
  tools: LlmTool[];
  callTool: (name: string, input: Record<string, unknown>, callId: string) => Promise<ToolResult>;
}

const SYSTEM =
  "Bạn là trợ lý Nexus. Trả lời bằng tiếng Việt, ngắn gọn. " +
  "Chỉ dùng số liệu lấy từ tool; không có dữ liệu thì nói không biết.";

/**
 * Tool calling MỘT bước (walking skeleton):
 *   lượt 1: LLM (có tools) → text và/hoặc tool_call
 *   chạy tool qua MCP
 *   lượt 2: LLM (không tools) đọc kết quả → câu trả lời cuối
 * Vòng lặp nhiều bước là việc của M11.
 */
export async function* answer(question: string, deps: OrchestratorDeps, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const messages: LlmMessage[] = [{ role: "user", content: question }];
  let text = "";
  const calls: ToolCall[] = [];

  for await (const ev of deps.llm.stream({ system: SYSTEM, messages, tools: deps.tools }, signal)) {
    if (ev.type === "text") {
      text += ev.delta;
      yield { type: "text", delta: ev.delta };
    } else if (ev.type === "tool_call") {
      calls.push(ev.call);
    }
  }
  if (calls.length === 0) {
    yield { type: "done" };
    return;
  }

  const results: ToolResult[] = [];
  for (const call of calls) {
    yield { type: "tool_start", name: call.name, input: call.input };
    const t0 = performance.now();
    const result = await deps.callTool(call.name, call.input, call.id).catch(
      (err: unknown): ToolResult => ({
        callId: call.id, isError: true,
        content: `Tool ${call.name} lỗi: ${err instanceof Error ? err.message : String(err)}`,
      }),
    );
    results.push(result);
    yield { type: "tool_end", name: call.name, ok: !result.isError, ms: Math.round(performance.now() - t0) };
  }

  messages.push({ role: "assistant", text, toolCalls: calls }, { role: "tool", results });
  for await (const ev of deps.llm.stream({ system: SYSTEM, messages, tools: [] }, signal)) {
    if (ev.type === "text") yield { type: "text", delta: ev.delta };
  }
  yield { type: "done" };
}
