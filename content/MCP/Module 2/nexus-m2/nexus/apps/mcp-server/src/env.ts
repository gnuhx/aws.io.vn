import { z } from "zod";

const LogLevel = z.enum(["debug", "info", "warn", "error"]).default("info");

/**
 * Hai chế độ dữ liệu, mỗi chế độ đòi biến khác nhau → discriminated union theo NEXUS_DATA.
 * `memory` dùng cho test/smoke không cần Mongo; `mongo` là mặc định.
 */
const EnvSchema = z.discriminatedUnion("NEXUS_DATA", [
  z.object({
    NEXUS_DATA: z.literal("memory"),
    LOG_LEVEL: LogLevel,
  }),
  z.object({
    NEXUS_DATA: z.literal("mongo"),
    LOG_LEVEL: LogLevel,
    MONGODB_URI: z
      .string({ error: "thiếu MONGODB_URI" })
      .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI phải bắt đầu bằng mongodb:// hoặc mongodb+srv://"),
    MONGODB_DB: z.string().min(1).default("nexus"),
  }),
]);
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse({ NEXUS_DATA: "mongo", ...source });
  if (!parsed.success) {
    // stderr, KHÔNG phải stdout: stdout của server stdio là kênh JSON-RPC.
    process.stderr.write(`[nexus-mcp] cấu hình sai:\n${z.prettifyError(parsed.error)}\n`);
    process.exit(1);
  }
  return parsed.data;
}
