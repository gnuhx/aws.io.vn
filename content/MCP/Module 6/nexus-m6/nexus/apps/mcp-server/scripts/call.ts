/** Gọi 1 tool qua client SDK thật (stdio): node scripts/call.ts <tool> ['<json>'] */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const [name, json = "{}"] = process.argv.slice(2);
if (!name) {
  process.stderr.write("dùng: node scripts/call.ts <tool> ['<json>']\n");
  process.exit(2);
}
const server = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const client = new Client({ name: "nexus-call", version: "0.5.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], stderr: "ignore" }));
try {
  const r = await client.callTool({ name, arguments: JSON.parse(json) as Record<string, unknown> });
  for (const c of r.content as { type: string; text?: string }[]) {
    console.log(`${r.isError ? "[isError] " : ""}${c.type === "text" ? c.text : `<${c.type}>`}`);
  }
} catch (e) {
  console.log(`[protocol error] ${e instanceof Error ? e.message : String(e)}`);
} finally {
  await client.close();
}
