import { z } from "zod";

const Base = z.object({
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  /** API tỷ giá (hợp đồng open.er-api.com v6). Dev/test: trỏ vào scripts/rates-stub.ts. */
  RATES_API_URL: z.url().default("https://open.er-api.com/v6"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
});

/** Discriminated union: NEXUS_DATA=mongo thì bắt buộc có MONGODB_URI. */
const EnvSchema = z.discriminatedUnion("NEXUS_DATA", [
  Base.extend({
    NEXUS_DATA: z.literal("mongo"),
    MONGODB_URI: z.string().startsWith("mongodb"),
    MONGODB_DB: z.string().min(1).default("nexus"),
  }),
  Base.extend({ NEXUS_DATA: z.literal("memory") }),
]);
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse({ ...source, NEXUS_DATA: source["NEXUS_DATA"] ?? "mongo" });
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`);
    process.stderr.write(`[nexus-mcp] Cấu hình sai:\n${lines.join("\n")}\n`);
    process.exit(1);
  }
  return parsed.data;
}
