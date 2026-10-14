/**
 * Smoke test qua MCP client THẬT: spawn server bằng stdio, list tools, gọi từng tool.
 * Thay cho "mở Claude Desktop xem có hiện tool không" — chạy được trong CI.
 *   NEXUS_DATA=memory node scripts/smoke.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [entry],
  // Client chỉ chuyển một nhóm env an toàn (PATH, HOME...) — biến của mình phải truyền tường minh.
  env: { ...getDefaultEnvironment(), NEXUS_DATA: process.env["NEXUS_DATA"] ?? "memory", LOG_LEVEL: "warn" },
  stderr: "inherit",
});
const client = new Client({ name: "nexus-smoke", version: "0.1.0" });
await client.connect(transport);

const server = client.getServerVersion();
console.log(`server: ${server?.name}@${server?.version} · capabilities: ${Object.keys(client.getServerCapabilities() ?? {}).join(", ")}`);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);

function textOf(r: CallToolResult): string {
  return r.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n");
}

async function call(name: string, args: Record<string, unknown> = {}): Promise<void> {
  try {
    const r = (await client.callTool({ name, arguments: args })) as CallToolResult;
    console.log(`\n▶ ${name} ${JSON.stringify(args)}${r.isError ? "  [isError]" : ""}\n${textOf(r)}`);
  } catch (err) {
    console.log(`\n▶ ${name} ${JSON.stringify(args)}  [protocol error]\n${err instanceof Error ? err.message : String(err)}`);
  }
}

await call("ping");
await call("get_time", { timeZone: "Asia/Ho_Chi_Minh" });
await call("get_time", { timeZone: "Hanoi" });
await call("list_customers", { city: "ha noi", limit: 3 });
await call("list_customers", { limit: 500 });

await client.close();
