// Bẫy S7.1 — "singleton như DI .AddSingleton": 1 McpServer cho mọi session HTTP.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

const server = new McpServer({ name: "singleton", version: "1" }); // tạo 1 lần, dùng chung
for (const user of ["phiên của Lan", "phiên của Minh"]) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  try {
    await server.connect(transport);
    console.log(`✓ connect ${user}`);
  } catch (e) {
    console.log(`✗ connect ${user}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
