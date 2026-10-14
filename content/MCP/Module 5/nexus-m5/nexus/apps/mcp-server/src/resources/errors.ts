/**
 * Lỗi resource = JSON-RPC error (M4 · S4.2). SDK v1 đọc err.code / err.data và gửi err.message nguyên văn.
 * Không ném McpError: constructor của nó chèn tiền tố, client chèn lần 2.
 */
export class ResourceError extends Error {
  readonly code: number;
  readonly data: Record<string, unknown>;
  constructor(code: number, message: string, data: Record<string, unknown>) {
    super(message);
    this.name = "ResourceError";
    this.code = code;
    this.data = data;
  }
}

/** data chỉ có uri = "không tìm thấy" (spec 2026-07-28 / quy ước SDK v2). */
export const resourceNotFound = (uri: string): ResourceError =>
  new ResourceError(-32602, `Resource not found: ${uri}`, { uri });

export const invalidResourceUri = (uri: string, expected: string): ResourceError =>
  new ResourceError(-32602, `URI không hợp lệ: ${uri} — cần ${expected}`, { uri, expected });
