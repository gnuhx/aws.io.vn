import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Thành công: structuredContent (máy đọc, client tự kiểm theo outputSchema)
 * + bản text JSON của CÙNG dữ liệu (host/model chỉ đọc `content`).
 * `data: z.output<S>` → gõ sai field là lỗi COMPILE (SDK v1 không nối type outputSchema ↔ handler).
 */
export function toolOk<S extends z.ZodType>(schema: S, data: z.output<S>): CallToolResult {
  void schema; // chỉ dùng cho suy kiểu
  return {
    structuredContent: data as Record<string, unknown>,
    content: [{ type: "text", text: JSON.stringify(data) }],
  };
}

export interface ToolFailure {
  /** Chuyện gì xảy ra — sự thật cụ thể. */
  what: string;
  /** Làm gì tiếp — tham số nào đổi, tool nào gọi, hay dừng và báo người dùng. */
  next: string;
}

/** Lỗi mà model đọc được và tự sửa: result isError, KHÔNG phải JSON-RPC error. */
export function toolFail({ what, next }: ToolFailure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}

export interface Link {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

/**
 * M4 · S4.5 — thành công, nhưng `content` là 1 câu tóm tắt + các resource_link (tham chiếu) thay vì JSON đầy đủ.
 * Host/model đọc chi tiết từng mục khi CẦN qua resources/read.
 */
export function toolOkLinks<S extends z.ZodType>(schema: S, data: z.output<S>, summary: string, links: readonly Link[]): CallToolResult {
  void schema;
  return {
    structuredContent: data as Record<string, unknown>,
    content: [{ type: "text", text: summary }, ...links.map((l) => ({ type: "resource_link" as const, ...l }))],
  };
}
