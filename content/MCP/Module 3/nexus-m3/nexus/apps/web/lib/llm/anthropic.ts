import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { LlmEvent, LlmMessage, LlmProvider, StreamRequest } from "./types.ts";

export interface AnthropicOptions {
  apiKey: string;
  model: string;
}

function toAnthropic(messages: LlmMessage[]): Anthropic.MessageParam[] {
  return messages.map((m): Anthropic.MessageParam => {
    switch (m.role) {
      case "user":
        return { role: "user", content: m.content };
      case "assistant":
        return {
          role: "assistant",
          content: [
            ...(m.text ? [{ type: "text" as const, text: m.text }] : []),
            ...m.toolCalls.map((c) => ({ type: "tool_use" as const, id: c.id, name: c.name, input: c.input })),
          ],
        };
      case "tool":
        return {
          role: "user",
          content: m.results.map((r) => ({ type: "tool_result" as const, tool_use_id: r.callId, content: r.content, is_error: r.isError })),
        };
    }
  });
}

export function createAnthropicProvider(opts: AnthropicOptions): LlmProvider {
  const client = new Anthropic({ apiKey: opts.apiKey });
  return {
    name: "anthropic",
    async *stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const stream = client.messages.stream(
        {
          model: opts.model,
          max_tokens: 1024,
          system: req.system,
          messages: toAnthropic(req.messages),
          tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: { type: "object" as const, ...t.inputSchema } })),
        },
        { signal },
      );
      for await (const ev of stream) {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield { type: "text", delta: ev.delta.text };
      }
      const final = await stream.finalMessage();
      for (const block of final.content) {
        if (block.type === "tool_use") {
          yield { type: "tool_call", call: { id: block.id, name: block.name, input: block.input as Record<string, unknown> } };
        }
      }
      yield { type: "end" };
    },
  };
}
