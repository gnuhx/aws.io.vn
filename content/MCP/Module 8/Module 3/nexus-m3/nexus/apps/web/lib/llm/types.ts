/** Type trung lập của Nexus — type của SDK nhà cung cấp chỉ xuất hiện trong file adapter. */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type LlmMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; text: string; toolCalls: ToolCall[] }
  | { role: "tool"; results: Array<{ callId: string; content: string; isError: boolean }> };

export type LlmEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "end" };

export interface StreamRequest {
  system: string;
  messages: LlmMessage[];
  tools: ToolSpec[];
}

/** Strategy: mỗi provider là 1 object thỏa hợp đồng này. */
export interface LlmProvider {
  readonly name: string;
  stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent>;
}
