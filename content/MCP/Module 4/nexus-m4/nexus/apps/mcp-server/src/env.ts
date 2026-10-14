import { z } from "zod";

const EnvSchema = z.object({
  NEXUS_DATA: z.enum(["mongo", "memory"]).default("mongo"),
  MONGO_URL: z.string().default("mongodb://127.0.0.1:27017/?replicaSet=rs0"),
  MONGO_DB: z.string().default("nexus"),
  RATES_API_URL: z.url().default("https://open.er-api.com/v6"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000).default(5000),
  LOG_LEVEL: z.enum(["debug", "info", "warning", "error"]).default("info"),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    // stderr — stdout là kênh JSON-RPC
    process.stderr.write(`Cấu hình sai:\n${z.prettifyError(parsed.error)}\n`);
    process.exit(1);
  }
  return parsed.data;
}
