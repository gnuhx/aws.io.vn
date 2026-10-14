import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { renderContent } from "../format.ts";
import type { LlmBlock, LlmTool } from "../llm/types.ts";

/**
 * Ranh giới MCP ↔ LLM — đúng 2 việc MCP làm trong agent:
 *   tools/list → mô tả tool cho LLM;  tools/call → kết quả cho LLM.
 * Mọi thứ còn lại (hội thoại, lặp, dừng, ngân sách, chọn tool nào được phép) là của host.
 */
export function toLlmTool(t: Tool): LlmTool {
  return { name: t.name, description: t.description ?? t.title ?? t.name, inputSchema: t.inputSchema };
}

/** Kết quả tool lớn làm phình context ở MỌI lượt sau (cả hội thoại gửi lại mỗi lượt) → cắt có báo. */
export const MAX_RESULT_CHARS = 12_000;

export async function callAsLlm(
  mcp: Client,
  use: Extract<LlmBlock, { type: "tool_use" }>,
  allowed: ReadonlySet<string>,
  signal?: AbortSignal,
): Promise<Extract<LlmBlock, { type: "tool_result" }>> {
  if (!allowed.has(use.name)) {
    // model gọi tool không có trong danh sách đưa cho nó (bịa tên, hoặc tool bị host chặn)
    return { type: "tool_result", toolUseId: use.id, isError: true, content: `Tool ${use.name} không có. Chỉ dùng tool trong danh sách.` };
  }
  try {
    const r = await mcp.callTool({ name: use.name, arguments: use.input }, undefined, signal ? { signal } : {});
    if ("toolResult" in r) return { type: "tool_result", toolUseId: use.id, isError: true, content: "server trả định dạng cũ (toolResult)" };
    let text = r.content.map(renderContent).join("\n");
    if (text.length > MAX_RESULT_CHARS) text = `${text.slice(0, MAX_RESULT_CHARS)}\n[… cắt ${text.length - MAX_RESULT_CHARS} ký tự — thu hẹp bộ lọc]`;
    return { type: "tool_result", toolUseId: use.id, isError: r.isError === true, content: text };
  } catch (e) {
    // lỗi giao thức / transport: báo cho model như 1 lỗi tool, không làm sập cả vòng lặp
    return { type: "tool_result", toolUseId: use.id, isError: true, content: `Lỗi gọi tool: ${e instanceof Error ? e.message : String(e)}` };
  }
}
