import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Resource KHÔNG có `isError` như tool: lỗi đi bằng JSON-RPC error.
 * Không tìm thấy = -32602 (Invalid Params) + data { uri }:
 *   - spec 2026-07-28: MUST dùng -32602 (các bản trước gợi ý -32002; client SHOULD chấp nhận cả hai)
 *   - SDK v1 tự trả -32602 khi URI không khớp resource/template nào → Nexus nhất quán với SDK
 */
export const LEGACY_RESOURCE_NOT_FOUND = -32002;

/**
 * Lỗi JSON-RPC có `code` + `data`. SDK đọc `err.code` (số nguyên) và gửi `err.message` nguyên văn.
 * Không dùng `McpError` ở đây: constructor của nó đã chèn "MCP error <code>: " vào message,
 * rồi client SDK chèn THÊM lần nữa (output thật ở S4.2).
 */
export class ResourceError extends Error {
  readonly code: number;
  readonly data: Readonly<Record<string, string>>;
  constructor(code: number, message: string, data: Readonly<Record<string, string>>) {
    super(message);
    this.name = "ResourceError";
    this.code = code;
    this.data = data;
  }
}

/** data CHỈ có { uri } — quy ước của spec mới để client nhận ra "không tìm thấy". */
export const resourceNotFound = (uri: string, hint: string): ResourceError =>
  new ResourceError(ErrorCode.InvalidParams, `Resource not found: ${uri}. ${hint}`, { uri });

/** URI sai hình thức: cùng mã -32602 nhưng data có thêm `expected` → không nhầm với "không tìm thấy". */
export const invalidResourceUri = (uri: string, expected: string): ResourceError =>
  new ResourceError(ErrorCode.InvalidParams, `URI không hợp lệ: ${uri}. Cần dạng ${expected}.`, { uri, expected });
