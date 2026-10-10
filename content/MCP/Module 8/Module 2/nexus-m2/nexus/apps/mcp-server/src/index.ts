import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { openDataSource } from "./db.ts";
import { loadEnv } from "./env.ts";
import { createLogger, errorFields } from "./log.ts";
import { createNexusServer } from "./server.ts";

const env = loadEnv();
const log = createLogger(env.LOG_LEVEL);

try {
  const data = await openDataSource(env, log);
  const server = createNexusServer({ customers: data.customers, log, now: () => new Date() });

  let closing = false;
  const shutdown = async (reason: string): Promise<void> => {
    if (closing) return;
    closing = true;
    log.info("shutting down", { reason });
    await server.close();
    await data.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  // Host đóng pipe (Claude Desktop tắt, web app restart) → stdin kết thúc → tự thoát, không để process mồ côi.
  process.stdin.on("end", () => void shutdown("stdin closed"));

  await server.connect(new StdioServerTransport());
  log.info("nexus mcp-server ready", { transport: "stdio", data: env.NEXUS_DATA });
} catch (err) {
  log.error("startup failed", errorFields(err));
  process.exit(1);
}
