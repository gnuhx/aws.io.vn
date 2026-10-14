import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  CreateMessageRequestSchema,
  ErrorCode,
  McpError,
  type CreateMessageRequestParams,
  type CreateMessageResult,
} from "@modelcontextprotocol/sdk/types.js";
import { textOf, type LlmMessage, type LlmProvider } from "./llm/types.ts";

/** Spec gợi ý: người dùng từ chối → lỗi "User rejected sampling request" (ví dụ dùng code -1). */
export const USER_REJECTED = -1;

export type Decision = { ok: true; params: CreateMessageRequestParams } | { ok: false };
/** Người duyệt: xem request server gửi, cho qua (có thể sửa) hoặc từ chối. */
export type Approver = (params: CreateMessageRequestParams, signal: AbortSignal) => Promise<Decision>;

export function showRequest(p: CreateMessageRequestParams): string {
  const lines = p.messages.flatMap((m) => {
    const blocks = Array.isArray(m.content) ? m.content : [m.content];
    return blocks.map((b) => `${m.role}: ${b.type === "text" ? b.text : `<${b.type}>`}`);
  });
  return [`system: ${p.systemPrompt ?? "—"}`, ...lines, `maxTokens: ${p.maxTokens}`]
    .flatMap((l) => l.split("\n"))
    .map((l) => `│ ${l}`)
    .join("\n");
}

const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
  });

export const APPROVERS = {
  /** In request ra stderr rồi cho qua — mô phỏng người bấm "Cho phép" ngay. */
  auto: (log: (s: string) => void): Approver => async (params) => {
    log(`┌ server xin dùng LLM của bạn\n${showRequest(params)}\n└ ✓ đã duyệt`);
    return { ok: true, params };
  },
  deny: (log: (s: string) => void): Approver => async (params) => {
    log(`┌ server xin dùng LLM của bạn\n${showRequest(params)}\n└ ✗ từ chối`);
    return { ok: false };
  },
  /** Người duyệt chậm (đi pha cà phê) — để thấy timeout phía server (Bẫy 4). */
  slow: (log: (s: string) => void, ms: number): Approver => async (params, signal) => {
    log(`┌ server xin dùng LLM của bạn — người duyệt suy nghĩ ${ms} ms…`);
    await wait(ms, signal);
    log("└ ✓ đã duyệt (muộn)");
    return { ok: true, params };
  },
} as const;

function toLlm(p: CreateMessageRequestParams): LlmMessage[] {
  return p.messages.map((m) => {
    const blocks = Array.isArray(m.content) ? m.content : [m.content];
    return {
      role: m.role,
      content: blocks.map((b) => {
        if (b.type !== "text") throw new McpError(ErrorCode.InvalidParams, `client này chỉ chuyển text cho LLM, nhận ${b.type}`);
        return { type: "text" as const, text: b.text };
      }),
    };
  });
}

/** Bật sampling cho client: người duyệt → LLM của host → trả về server. Client phải khai capability `sampling`. */
export function enableSampling(client: Client, llm: LlmProvider, approve: Approver): void {
  client.setRequestHandler(CreateMessageRequestSchema, async (req, extra): Promise<CreateMessageResult> => {
    const d = await approve(req.params, extra.signal);
    if (!d.ok) throw new McpError(USER_REJECTED, "User rejected sampling request");
    const res = await llm.complete(
      {
        ...(d.params.systemPrompt ? { system: d.params.systemPrompt } : {}),
        messages: toLlm(d.params),
        maxTokens: d.params.maxTokens,
        ...(d.params.temperature !== undefined ? { temperature: d.params.temperature } : {}),
      },
      extra.signal,
    );
    return {
      role: "assistant",
      content: { type: "text", text: textOf(res) },
      model: res.model,
      stopReason: res.stopReason === "max_tokens" ? "maxTokens" : "endTurn",
    };
  });
}
