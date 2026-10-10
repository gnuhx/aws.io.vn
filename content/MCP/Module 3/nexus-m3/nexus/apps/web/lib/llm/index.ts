import "server-only";
import { serverEnv } from "../env.server.ts";
import { createAnthropicProvider } from "./anthropic.ts";
import { createScriptedProvider } from "./scripted.ts";
import type { LlmProvider } from "./types.ts";

let provider: LlmProvider | undefined;

/** Factory: chọn implementation theo env (đã là discriminated union). */
export function llm(): LlmProvider {
  if (provider) return provider;
  const env = serverEnv();
  switch (env.LLM_PROVIDER) {
    case "anthropic":
      provider = createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL });
      break;
    case "scripted":
      provider = createScriptedProvider({ delayMs: 60 });
      break;
  }
  return provider;
}
