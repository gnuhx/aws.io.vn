import "server-only";
import path from "node:path";
import { z } from "zod";

const Common = z.object({
  NEXUS_DATA: z.enum(["mongo", "memory"]).default("mongo"),
  MONGODB_URI: z.string().optional(),
  MCP_SERVER_ENTRY: z.string().default(path.resolve(process.cwd(), "../mcp-server/src/index.ts")),
});

/** LLM_PROVIDER=anthropic ⇒ bắt buộc có key (discriminated union — tsc biết điều đó). */
const ServerEnvSchema = z.discriminatedUnion("LLM_PROVIDER", [
  Common.extend({
    LLM_PROVIDER: z.literal("anthropic"),
    ANTHROPIC_API_KEY: z.string().min(1, "thiếu ANTHROPIC_API_KEY"),
    ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5"),
  }),
  Common.extend({ LLM_PROVIDER: z.literal("scripted") }),
]);
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | undefined;

/** Lười + cache: không chạy lúc import (next build không cần env thật); instrumentation gọi lúc boot. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = ServerEnvSchema.safeParse({ ...process.env, LLM_PROVIDER: process.env["LLM_PROVIDER"] ?? "anthropic" });
  if (!parsed.success) {
    throw new Error("Cấu hình web sai: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  cached = parsed.data;
  return cached;
}
