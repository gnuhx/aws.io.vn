/**
 * Hai hình dạng kết quả tool của Nexus.
 *  - toolOk: structuredContent (máy đọc, khớp outputSchema) + text JSON (cho client/LLM chỉ đọc content).
 *  - toolFail: isError + 1 câu "chuyện gì xảy ra" + 1 câu "làm gì tiếp" — LLM đọc để tự sửa.
 * Lỗi giao thức (JSON-RPC error) KHÔNG đi qua đây: đó là việc của SDK.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export function toolOk<S extends z.ZodObject>(schema: S, data: z.output<S>, extra: CallToolResult["content"] = []): CallToolResult {
  // schema chỉ để TS kiểm data khớp outputSchema lúc biên dịch; SDK kiểm lại lúc chạy
  void schema;
  return {
    structuredContent: data,
    content: [{ type: "text", text: JSON.stringify(data) }, ...extra],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật, không đoán, không stack trace. */
  what: string;
  /** LLM (hoặc người dùng) nên làm gì tiếp: gọi tool nào, sửa tham số nào, hay dừng. */
  next: string;
}

export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}
