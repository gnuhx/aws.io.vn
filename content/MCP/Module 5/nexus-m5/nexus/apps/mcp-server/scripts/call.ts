// node scripts/call.ts <tool> '<json args>'
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { connect } from "./client.ts";

const [name, json = "{}"] = process.argv.slice(2);
if (!name) {
  process.stderr.write("cách dùng: node scripts/call.ts <tool> '<json args>'\n");
  process.exit(2);
}
const client = await connect();
try {
  const res = (await client.callTool({ name, arguments: JSON.parse(json) as Record<string, unknown> })) as CallToolResult;
  for (const c of res.content) {
    if (c.type === "text") console.log(`${res.isError ? "[isError] " : ""}${c.text}`);
    else if (c.type === "resource_link") console.log(`[resource_link] ${c.uri} ${c.title ?? c.name}`);
    else if (c.type === "image") console.log(`[image ${c.mimeType}] ${c.data.length} ký tự base64`);
    else console.log(`[${c.type}]`);
  }
} catch (err) {
  console.log(`[protocol error] ${err instanceof Error ? err.message : String(err)}`);
} finally {
  await client.close();
}
