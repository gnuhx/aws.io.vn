import "server-only";
import type { ChatEvent } from "@nexus/shared";
import { llm } from "../llm/index.ts";
import type { LlmMessage, ToolCall, ToolSpec } from "../llm/types.ts";
import { callMcpTool } from "../mcp/host.ts";

const SYSTEM = "Bạn là trợ lý dữ liệu của Nexus. Dùng tool để tra số liệu, không đoán. Trả lời ngắn bằng tiếng Việt.";

/**
 * Tool calling MỘT bước (đủ cho skeleton; vòng lặp nhiều bước là M11):
 * lượt 1 có tools → gọi tool qua MCP → lượt 2 không tools, viết câu trả lời.
 */
export async function* answer(question: string, tools: ToolSpec[], signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const messages: LlmMessage[] = [{ role: "user", content: question }];
  const calls: ToolCall[] = [];
  let text = "";
  for await (const ev of llm().stream({ system: SYSTEM, messages, tools }, signal)) {
    if (ev.type === "text") { text += ev.delta; yield { type: "text", delta: ev.delta }; }
    if (ev.type === "tool_call") calls.push(ev.call);
  }
  if (calls.length === 0) { yield { type: "done" }; return; }

  messages.push({ role: "assistant", text, toolCalls: calls });
  const results: Array<{ callId: string; content: string; isError: boolean }> = [];
  for (const call of calls) {
    yield { type: "tool_start", name: call.name, input: call.input };
    const t0 = performance.now();
    const r = await callMcpTool(call.name, call.input, signal);
    yield { type: "tool_end", name: call.name, ok: !r.isError, ms: Math.round(performance.now() - t0) };
    results.push({ callId: call.id, ...r });
  }
  messages.push({ role: "tool", results });

  for await (const ev of llm().stream({ system: SYSTEM, messages, tools: [] }, signal)) {
    if (ev.type === "text") yield { type: "text", delta: ev.delta };
  }
  yield { type: "done" };
}
