import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDeps } from "./deps.ts";
import { loadEnv } from "./env.ts";
import { createServer, SERVER_INFO } from "./server.ts";

const env = loadEnv();
const deps = createDeps(env);
const server = createServer(deps);

await server.connect(new StdioServerTransport());
deps.log.info("nexus mcp-server started", { version: SERVER_INFO.version, transport: "stdio" });

const stop = async (signal: string): Promise<void> => {
  deps.log.info("shutting down", { signal });
  await server.close();
  process.exit(0);
};
process.on("SIGTERM", () => void stop("SIGTERM"));
process.on("SIGINT", () => void stop("SIGINT"));
