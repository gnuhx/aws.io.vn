import "server-only";
import path from "node:path";
import { z } from "zod";

/**
 * Env của web app — chỉ đọc ở server. Không có tiền tố NEXT_PUBLIC_ nào ở đây:
 * biến NEXT_PUBLIC_* được Next nhúng thẳng vào bundle gửi xuống trình duyệt.
 */
const Base = z.object({
  MCP_SERVER_ENTRY: z.string().default(path.resolve(process.cwd(), "../mcp-server/src/index.ts")),
  NEXUS_DATA: z.enum(["mongo", "memory"]).default("mongo"),
  MONGODB_URI: z.string().optional(),
});

const EnvSchema = z.discriminatedUnion("LLM_PROVIDER", [
  Base.extend({
    LLM_PROVIDER: z.literal("anthropic"),
    ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-", "ANTHROPIC_API_KEY phải bắt đầu bằng sk-ant-"),
    ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5"),
  }),
  // Provider giả lập: chạy được end-to-end khi chưa có API key (dev, CI, demo offline).
  Base.extend({ LLM_PROVIDER: z.literal("scripted") }),
]);
export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse({ LLM_PROVIDER: "anthropic", ...process.env });
  if (!parsed.success) throw new Error(`Cấu hình web sai:\n${z.prettifyError(parsed.error)}`);
  cached = parsed.data;
  return cached;
}
