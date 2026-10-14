// Đọc 1 resource qua MCP client THẬT (stdio) — lệnh nghiệm thu của M4.
//   node scripts/read.ts nexus://customers/cus_007
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpError } from "@modelcontextprotocol/sdk/types.js";

const [uri] = process.argv.slice(2);
if (!uri) {
  process.stderr.write("dùng: node scripts/read.ts <uri>\n");
  process.exit(2);
}
const client = new Client({ name: "nexus-read", version: "0.4.0" });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../src/index.ts", import.meta.url).pathname],
    env: { ...(process.env as Record<string, string>), NEXUS_DATA: process.env.NEXUS_DATA ?? "memory", LOG_LEVEL: "error" },
    stderr: "inherit",
  }),
);
const t0 = performance.now();
try {
  const { contents } = await client.readResource({ uri });
  for (const c of contents) {
    if ("text" in c) console.log(`${c.uri} · ${c.mimeType ?? "?"} · text ${c.text.length} ký tự\n${c.text}`);
    else console.log(`${c.uri} · ${c.mimeType ?? "?"} · blob base64 ${c.blob.length} ký tự, bắt đầu '${c.blob.slice(0, 5)}'`);
  }
} catch (err) {
  // Resource không có isError: lỗi là JSON-RPC error
  if (err instanceof McpError) console.log(`[protocol error] code=${err.code} ${err.message}${err.data === undefined ? "" : ` data=${JSON.stringify(err.data)}`}`);
  else throw err;
}
console.log(`(${Math.round(performance.now() - t0)} ms)`);
await client.close();
