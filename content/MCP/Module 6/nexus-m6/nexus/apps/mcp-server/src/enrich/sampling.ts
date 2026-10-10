import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { ErrorCode, McpError, type CreateMessageRequestParams } from "@modelcontextprotocol/sdk/types.js";
import { CITIES, EnrichSuggestionSchema, INDUSTRIES, type Customer, type EnrichField, type EnrichSuggestion } from "@nexus/shared";
import { z } from "zod";

export type Sampled =
  | { ok: true; suggestion: EnrichSuggestion; model: string }
  | { ok: false; reason: "unsupported" | "rejected" | "timeout" | "bad_output" | "failed"; detail: string };

/** Mã lỗi client dùng khi NGƯỜI DÙNG từ chối (spec: ví dụ "User rejected sampling request", code -1). */
export const USER_REJECTED = -1;

/**
 * Request mà NGƯỜI DÙNG sẽ đọc trong hộp duyệt của client: chỉ dữ liệu cần (không email, không gói),
 * nói rõ mục đích, nói rõ định dạng trả về. Người duyệt có thể sửa hoặc từ chối.
 */
export function buildRequest(c: Customer, missing: readonly EnrichField[]): CreateMessageRequestParams {
  const text = [
    `Khách ${c.id} thiếu: ${missing.join(", ")}. Đề xuất giá trị từ thông tin dưới đây.`,
    `Tên: ${c.name}`,
    `Địa chỉ: ${c.address}`,
    `Ghi chú: ${c.note || "—"}`,
    "",
    `city: một trong ${CITIES.join(" | ")}, hoặc null nếu không chắc`,
    `industry: một trong ${INDUSTRIES.join(" | ")}, hoặc null nếu không chắc`,
    'Chỉ trả về 1 object JSON: {"city": ..., "industry": ...}',
  ].join("\n");
  return {
    systemPrompt: "Bạn chuẩn hóa dữ liệu khách hàng cho hệ thống Nexus. Không bịa: không chắc thì trả null.",
    messages: [{ role: "user", content: { type: "text", text } }],
    maxTokens: 120,
    temperature: 0,
    includeContext: "none",
    modelPreferences: { hints: [{ name: "haiku" }], costPriority: 0.9, speedPriority: 0.8, intelligencePriority: 0.3 },
  };
}

/** LLM hay bọc JSON trong ```json … ``` hoặc thêm câu dẫn: lấy từ { đầu tới } cuối rồi mới parse. */
export function extractJson(text: string): unknown {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return undefined;
  try {
    return JSON.parse(text.slice(a, b + 1)) as unknown;
  } catch {
    return undefined;
  }
}

export async function askClientLlm(
  server: Server,
  c: Customer,
  missing: readonly EnrichField[],
  opts: RequestOptions,
): Promise<Sampled> {
  if (!server.getClientCapabilities()?.sampling) {
    return { ok: false, reason: "unsupported", detail: "client không khai báo capability sampling" };
  }
  let result;
  try {
    result = await server.createMessage(buildRequest(c, missing), opts);
  } catch (e) {
    if (e instanceof McpError && e.code === ErrorCode.RequestTimeout) return { ok: false, reason: "timeout", detail: "hết giờ chờ người duyệt / LLM" };
    if (e instanceof McpError && e.code === USER_REJECTED) return { ok: false, reason: "rejected", detail: "người dùng từ chối" };
    return { ok: false, reason: "failed", detail: e instanceof Error ? e.message : String(e) };
  }
  if (result.content.type !== "text") return { ok: false, reason: "bad_output", detail: `nhận ${result.content.type}, cần text` };
  const parsed = EnrichSuggestionSchema.safeParse(extractJson(result.content.text));
  if (!parsed.success) {
    return { ok: false, reason: "bad_output", detail: `câu trả lời không hợp lệ: ${z.prettifyError(parsed.error).replace(/\n/g, " ")}` };
  }
  return { ok: true, suggestion: parsed.data, model: result.model };
}
