export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export type LlmMessage =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool"; toolCallId: string; name: string; content: string; isError: boolean };

export interface StreamRequest {
  /** System prompt do host ghép — gồm cả resource mà ỨNG DỤNG chọn đưa vào (M4). */
  system: string;
  messages: LlmMessage[];
  tools: ToolSpec[];
}

export type LlmEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; call: { id: string; name: string; input: Record<string, unknown> } }
  | { type: "end" };

export interface LlmProvider {
  stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent>;
}
