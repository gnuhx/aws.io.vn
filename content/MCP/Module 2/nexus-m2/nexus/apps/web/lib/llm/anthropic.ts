import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { LlmEvent, LlmMessage, LlmProvider, LlmRequest } from "./types.ts";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
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
        // Anthropic: kết quả tool đi trong lượt "user", mỗi kết quả trỏ về tool_use_id
        return {
          role: "user",
          content: m.results.map((r) => ({
            type: "tool_result" as const, tool_use_id: r.callId, content: r.content, is_error: r.isError,
          })),
        };
    }
  });
}

const STOP: Record<string, "end_turn" | "tool_use" | "max_tokens"> = {
  end_turn: "end_turn", tool_use: "tool_use", max_tokens: "max_tokens",
};

export function createAnthropicProvider(opts: { apiKey: string; model: string }): LlmProvider {
  const client = new Anthropic({ apiKey: opts.apiKey, maxRetries: 2, timeout: 60_000 });
  return {
    name: `anthropic:${opts.model}`,
    async *stream(req: LlmRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const stream = client.messages.stream(
        {
          model: opts.model,
          max_tokens: 1024,
          system: req.system,
          messages: toAnthropic(req.messages),
          ...(req.tools.length > 0 && {
            tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })),
          }),
        },
        { signal },
      );
      for await (const ev of stream) {
        if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
          yield { type: "text", delta: ev.delta.text };
        }
      }
      const final = await stream.finalMessage();
      for (const block of final.content) {
        if (block.type === "tool_use") {
          yield { type: "tool_call", call: { id: block.id, name: block.name, input: isRecord(block.input) ? block.input : {} } };
        }
      }
      yield { type: "end", stopReason: STOP[final.stop_reason ?? ""] ?? "other" };
    },
  };
}
