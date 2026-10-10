import { z } from "zod";

/** Env được kiểm 1 lần lúc khởi động; sai thì thoát với lỗi rõ (M0 · S0.2). */
const EnvSchema = z.object({
  NEXUS_DATA: z.enum(["memory", "mongo"]).default("memory"),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/nexus?replicaSet=rs0"),
  RATES_URL: z.url().default("http://127.0.0.1:4010"),
  RATES_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
  // M5 · S5.1: thư mục duy nhất tool file được chạm tới
  NEXUS_EXPORT_DIR: z.string().min(1).default(new URL("../var/exports", import.meta.url).pathname),
  // M5 · S5.2: user Mongo chỉ có role "read" — KHÁC MONGO_URI của phần ghi
  MONGO_READONLY_URI: z.string().default("mongodb://nexus_reader:change-me@127.0.0.1:27017/nexus?replicaSet=rs0&authSource=admin"),
  // M5 · S5.3: helpdesk bên ngoài — token chỉ đọc từ env, không có giá trị mặc định
  HELPDESK_URL: z.url().default("http://127.0.0.1:4020"),
  HELPDESK_TOKEN: z.string().min(1).optional(),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      process.stderr.write(`env ${issue.path.join(".")}: ${issue.message}\n`);
    }
    process.exit(1);
  }
  return parsed.data;
}
