import { z } from "zod";

const EnvSchema = z.object({
  NEXUS_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEXUS_EXPORT_DIR: z.string().min(1).default("var/exports"),
  /** Client không hỗ trợ elicitation: deny = không xóa (mặc định), allow = tin hộp xác nhận của host (destructiveHint). */
  NEXUS_DELETE_WITHOUT_ELICITATION: z.enum(["deny", "allow"]).default("deny"),
  /** Khóa ký cursor (≥ 32 ký tự). Không đặt → khóa ngẫu nhiên mỗi lần chạy: cursor không sống qua restart (S6.4). */
  NEXUS_CURSOR_SECRET: z.string().min(32).optional(),
  NEXUS_CURSOR_TTL_S: z.coerce.number().int().min(10).max(86_400).default(900),
  NEXUS_SAMPLING_TIMEOUT_MS: z.coerce.number().int().min(100).max(300_000).default(30_000),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const r = EnvSchema.safeParse(source);
  if (!r.success) {
    // stderr: stdout là kênh JSON-RPC (M2)
    process.stderr.write(`[nexus] cấu hình sai:\n${z.prettifyError(r.error)}\n`);
    process.exit(1);
  }
  return r.data;
}
