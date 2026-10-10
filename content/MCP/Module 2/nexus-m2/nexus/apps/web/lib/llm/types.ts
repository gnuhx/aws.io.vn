/**
 * Hợp đồng trung lập giữa app và mọi LLM provider.
 * Orchestrator chỉ biết các type này — đổi Anthropic sang provider khác không đụng tới route.
 */
export interface LlmTool {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties?: Record<string, object>; required?: string[] };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  callId: string;
  content: string;
  isError: boolean;
}

export type LlmMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; text: string; toolCalls: ToolCall[] }
  | { role: "tool"; results: ToolResult[] };

export type LlmEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "end"; stopReason: "end_turn" | "tool_use" | "max_tokens" | "other" };

export interface LlmRequest {
  system: string;
  messages: LlmMessage[];
  /** Mảng rỗng = không cho gọi tool ở lượt này. */
  tools: LlmTool[];
}

export interface LlmProvider {
  readonly name: string;
  stream(req: LlmRequest, signal: AbortSignal): AsyncIterable<LlmEvent>;
}
