/**
 * Gọi 1 tool của Nexus qua MCP client thật (spawn server bằng stdio) và in: thời gian, isError, content, structuredContent.
 *   node scripts/call.ts <tool> '<json args>'
 * Env chuyển cho server: NEXUS_DATA (mặc định memory), MONGODB_URI, RATES_API_URL, RATES_TIMEOUT_MS, LOG_LEVEL (mặc định warn).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const [name = "nexus_ping", raw = "{}"] = process.argv.slice(2);
const env: Record<string, string> = { NEXUS_DATA: "memory", LOG_LEVEL: "warn", PATH: process.env["PATH"] ?? "" };
for (const k of ["NEXUS_DATA", "MONGODB_URI", "RATES_API_URL", "RATES_TIMEOUT_MS", "LOG_LEVEL"]) {
  const v = process.env[k];
  if (v) env[k] = v;
}
const client = new Client({ name: "nexus-call", version: "0.0.0" });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL("../src/index.ts", import.meta.url))], env, stderr: "ignore" }),
);
await client.listTools(); // client cache outputSchema để tự kiểm structuredContent
const t0 = performance.now();
const res = await client.callTool({ name, arguments: JSON.parse(raw) as Record<string, unknown> });
console.log(`${res.isError ? "[isError]" : "ok"} ${name} · ${Math.round(performance.now() - t0)} ms`);
for (const c of Array.isArray(res.content) ? res.content : []) {
  if (c.type === "text") console.log(`  content[text]  ${c.text}`);
  else if (c.type === "image") console.log(`  content[image] ${c.mimeType} · base64 ${c.data.length} ký tự`);
  else console.log(`  content[${c.type}]`);
}
if (res.structuredContent) console.log(`  structuredContent ${JSON.stringify(res.structuredContent)}`);
await client.close();
