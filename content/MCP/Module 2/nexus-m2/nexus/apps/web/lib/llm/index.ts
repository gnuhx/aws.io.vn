import "server-only";
import { serverEnv } from "../env.server.ts";
import { createAnthropicProvider } from "./anthropic.ts";
import { createScriptedProvider } from "./scripted.ts";
import type { LlmProvider } from "./types.ts";

let provider: LlmProvider | undefined;

/** Factory: chọn implementation theo env, 1 lần cho cả process. */
export function llm(): LlmProvider {
  if (provider) return provider;
  const env = serverEnv();
  provider = env.LLM_PROVIDER === "anthropic"
    ? createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL })
    : createScriptedProvider();
  return provider;
}
