// Lấy 1 prompt qua MCP client THẬT (stdio) — lệnh nghiệm thu của M4.
//   node scripts/prompt.ts nexus_weekly_summary '{"team":"sales"}'
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpError } from "@modelcontextprotocol/sdk/types.js";

const [name, rawArgs = "{}"] = process.argv.slice(2);
if (!name) {
  process.stderr.write("dùng: node scripts/prompt.ts <prompt> '<json args: mọi giá trị là chuỗi>'\n");
  process.exit(2);
}
const parsed: unknown = JSON.parse(rawArgs);
if (typeof parsed !== "object" || parsed === null || Object.values(parsed).some((v) => typeof v !== "string")) {
  throw new Error("args của prompt phải là object { tên: chuỗi }");
}
const args = parsed as Record<string, string>;

const client = new Client({ name: "nexus-prompt", version: "0.4.0" });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../src/index.ts", import.meta.url).pathname],
    env: { ...(process.env as Record<string, string>), NEXUS_DATA: "memory", LOG_LEVEL: "error" },
    stderr: "inherit",
  }),
);
try {
  const res = await client.getPrompt({ name, arguments: args });
  console.log(`description: ${res.description ?? "—"}`);
  for (const [i, m] of res.messages.entries()) {
    const c = m.content;
    const body = c.type === "text" ? c.text : c.type === "resource" ? `[resource ${c.resource.uri}, ${"text" in c.resource ? c.resource.text.length + " ký tự" : "blob"}]` : `[${c.type}]`;
    console.log(`#${i + 1} ${m.role}: ${body}`);
  }
} catch (err) {
  if (err instanceof McpError) console.log(`[protocol error] code=${err.code} ${err.message}`);
  else throw err;
}
await client.close();
