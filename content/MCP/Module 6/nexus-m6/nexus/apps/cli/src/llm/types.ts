/**
 * Hợp đồng LLM của host — KHÔNG phải MCP. MCP không quy định host nói chuyện với model thế nào;
 * đây là phần "của host/LLM" trong agent (S6.4). Hình dạng gần Messages API để adapter mỏng.
 */
export type LlmBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolUseId: string; content: string; isError: boolean };

export interface LlmMessage {
  role: "user" | "assistant";
  content: LlmBlock[];
}

export interface LlmTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LlmRequest {
  system?: string;
  messages: LlmMessage[];
  tools?: LlmTool[];
  maxTokens: number;
  temperature?: number;
}

export type StopReason = "end_turn" | "tool_use" | "max_tokens";

export interface LlmResponse {
  content: Extract<LlmBlock, { type: "text" | "tool_use" }>[];
  stopReason: StopReason;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface LlmProvider {
  readonly name: string;
  complete(req: LlmRequest, signal?: AbortSignal): Promise<LlmResponse>;
}

export type LlmErrorKind = "config" | "auth" | "rate_limited" | "bad_request" | "unavailable" | "script";

export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly status: number | undefined;
  constructor(kind: LlmErrorKind, message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.kind = kind;
    this.status = status;
  }
}

export const textOf = (r: Pick<LlmResponse, "content">): string =>
  r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
