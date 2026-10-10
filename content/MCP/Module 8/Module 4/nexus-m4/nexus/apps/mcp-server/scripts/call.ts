// Gọi 1 tool qua MCP client THẬT (stdio) — dùng cho lệnh nghiệm thu.
//   node scripts/call.ts <tool> '<json args>'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const [name, rawArgs = "{}"] = process.argv.slice(2);
if (!name) {
  process.stderr.write("dùng: node scripts/call.ts <tool> '<json args>'\n");
  process.exit(2);
}
const args: unknown = JSON.parse(rawArgs);
if (typeof args !== "object" || args === null || Array.isArray(args)) throw new Error("args phải là JSON object");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [new URL("../src/index.ts", import.meta.url).pathname],
  env: { ...(process.env as Record<string, string>), NEXUS_DATA: process.env.NEXUS_DATA ?? "memory", LOG_LEVEL: "error" },
  stderr: "inherit",
});
const client = new Client({ name: "nexus-call", version: "0.3.0" });
await client.connect(transport);
const t0 = performance.now();
const res = (await client.callTool({ name, arguments: args as Record<string, unknown> })) as CallToolResult;
const ms = Math.round(performance.now() - t0);
for (const c of res.content) {
  if (c.type === "text") console.log(`${res.isError ? "[isError] " : ""}${c.text}`);
  else if (c.type === "image") console.log(`[image ${c.mimeType}, base64 ${c.data.length} ký tự, bắt đầu '${c.data.slice(0, 5)}']`);
  else if (c.type === "resource_link") console.log(`[resource_link] ${c.uri}  ${c.title ?? c.name}`);
  else console.log(`[${c.type}]`);
}
if (res.structuredContent) console.log("structuredContent:", JSON.stringify(res.structuredContent));
console.log(`(${ms} ms)`);
await client.close();
