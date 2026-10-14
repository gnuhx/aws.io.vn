import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Thành công: cùng dữ liệu ở 2 dạng — text JSON cho model, structuredContent cho máy (M3 · S3.3). */
export function toolOk<T extends Record<string, unknown>>(data: T): CallToolResult & { structuredContent: T } {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data };
}

/** Lỗi nghiệp vụ model tự sửa được: "chuyện gì xảy ra + làm gì tiếp theo" (M3 · S3.3). */
export function toolFail(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}
