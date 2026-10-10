import { anthropicProvider } from "./anthropic.ts";
import { scriptedProvider } from "./scripted.ts";
import { SCRIPTS } from "./scripts.ts";
import { LlmError, type LlmProvider } from "./types.ts";

/** `--llm anthropic` | `--llm scripted:<kịch bản>` */
export function providerFromFlag(flag: string, env: NodeJS.ProcessEnv = process.env): LlmProvider {
  if (flag === "anthropic") {
    return anthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.NEXUS_LLM_MODEL ?? "claude-haiku-5-5" });
  }
  const m = /^scripted:(.+)$/.exec(flag);
  const script = m?.[1] ? SCRIPTS[m[1]] : undefined;
  if (!m?.[1] || !script) {
    throw new LlmError("config", `--llm "${flag}" không hợp lệ. Dùng: anthropic | ${Object.keys(SCRIPTS).map((k) => `scripted:${k}`).join(" | ")}`);
  }
  return scriptedProvider(m[1], script.steps, { repeatLast: script.repeatLast ?? false });
}
