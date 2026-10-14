#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDeps } from "./deps.ts";
import { loadEnv } from "./env.ts";
import { createServer } from "./server.ts";

const deps = await createDeps(loadEnv());
const server = createServer(deps);
await server.connect(new StdioServerTransport());
deps.log.info("nexus mcp server ready (stdio)");

const shutdown = async (): Promise<void> => {
  await server.close();
  await deps.close();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
