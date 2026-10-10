import { z } from "zod";
import { LlmError, type LlmBlock, type LlmProvider, type LlmRequest, type LlmResponse } from "./types.ts";

const ResponseSchema = z.object({
  model: z.string(),
  stop_reason: z.enum(["end_turn", "tool_use", "max_tokens", "stop_sequence", "pause_turn", "refusal"]).nullable(),
  content: z.array(
    z.discriminatedUnion("type", [
      z.object({ type: z.literal("text"), text: z.string() }),
      z.object({ type: z.literal("tool_use"), id: z.string(), name: z.string(), input: z.record(z.string(), z.unknown()) }),
      z.object({ type: z.literal("thinking"), thinking: z.string() }),
    ]),
  ),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});
const ErrorSchema = z.object({ error: z.object({ type: z.string(), message: z.string() }) });

function toWire(b: LlmBlock): Record<string, unknown> {
  switch (b.type) {
    case "text":
      return { type: "text", text: b.text };
    case "tool_use":
      return { type: "tool_use", id: b.id, name: b.name, input: b.input };
    case "tool_result":
      return { type: "tool_result", tool_use_id: b.toolUseId, content: b.content, is_error: b.isError };
  }
}

export interface AnthropicOptions {
  apiKey: string | undefined;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
}

/** Adapter mỏng tới Messages API. API key chỉ nằm ở host — server MCP không bao giờ thấy nó. */
export function anthropicProvider(opts: AnthropicOptions): LlmProvider {
  const base = opts.baseUrl ?? "https://api.anthropic.com";
  return {
    name: `anthropic:${opts.model}`,
    async complete(req: LlmRequest, signal?: AbortSignal): Promise<LlmResponse> {
      if (!opts.apiKey) throw new LlmError("config", "thiếu ANTHROPIC_API_KEY");
      const body = {
        model: opts.model,
        max_tokens: req.maxTokens,
        ...(req.system ? { system: req.system } : {}),
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        ...(req.tools?.length ? { tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema })) } : {}),
        messages: req.messages.map((m) => ({ role: m.role, content: m.content.map(toWire) })),
      };
      const timeout = AbortSignal.timeout(opts.timeoutMs ?? 60_000);
      const res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": opts.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      const json: unknown = await res.json().catch(() => undefined);
      if (!res.ok) {
        const e = ErrorSchema.safeParse(json);
        const msg = e.success ? `${e.data.error.type}: ${e.data.error.message}` : `HTTP ${res.status}`;
        const kind = res.status === 401 || res.status === 403 ? "auth" : res.status === 429 ? "rate_limited" : res.status >= 500 ? "unavailable" : "bad_request";
        throw new LlmError(kind, `LLM ${res.status} ${msg}`, res.status);
      }
      const r = ResponseSchema.parse(json);
      return {
        model: r.model,
        stopReason: r.stop_reason === "tool_use" ? "tool_use" : r.stop_reason === "max_tokens" ? "max_tokens" : "end_turn",
        content: r.content.flatMap((b) => (b.type === "thinking" ? [] : [b])),
        usage: { inputTokens: r.usage.input_tokens, outputTokens: r.usage.output_tokens },
      };
    },
  };
}
