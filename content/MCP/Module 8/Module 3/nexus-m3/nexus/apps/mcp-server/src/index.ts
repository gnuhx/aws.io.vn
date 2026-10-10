import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadEnv } from "./env.ts";
import { createLogger, mcpLogSink, stderrSink } from "./log.ts";
import { openDataSource, type DataSource } from "./db.ts";
import { createRatesClient } from "./rates/client.ts";
import { createServer } from "./server.ts";

const env = loadEnv();
const log = createLogger(stderrSink(env.LOG_LEVEL));

let data: DataSource;
try {
  data = await openDataSource(env, log);
} catch (err) {
  log.error("không mở được data source", { err: String(err) });
  process.exit(1);
}

const rates = createRatesClient({ baseUrl: env.RATES_API_URL, timeoutMs: env.RATES_TIMEOUT_MS });
const server = createServer({ customers: data.customers, rates, log, now: () => new Date() });
// Gắn sink MCP TRƯỚC connect: handler logging/setLevel phải có sẵn khi client gửi tới
log.attach(mcpLogSink(server));
await server.connect(new StdioServerTransport());
log.info("nexus mcp-server ready", { transport: "stdio" });

let closing = false;
async function shutdown(reason: string): Promise<void> {
  if (closing) return;
  closing = true;
  log.info("shutting down", { reason });
  await server.close().catch(() => {});
  await data.close().catch(() => {});
  process.exit(0);
}
process.stdin.on("end", () => void shutdown("stdin closed"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
