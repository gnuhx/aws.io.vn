// node scripts/read.ts <uri>
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { connect } from "./client.ts";

const uri = process.argv[2];
if (!uri) {
  process.stderr.write("cách dùng: node scripts/read.ts <uri>\n");
  process.exit(2);
}
const client = await connect();
try {
  const t0 = performance.now();
  const { contents } = await client.readResource({ uri });
  const ms = Math.round(performance.now() - t0);
  for (const c of contents) {
    if ("text" in c) console.log(`${c.mimeType} · ${c.text.length} ký tự · ${ms} ms\n${c.text}`);
    else console.log(`${c.mimeType} · blob base64 ${c.blob.length} ký tự · bắt đầu ${c.blob.slice(0, 5)} · ${ms} ms`);
  }
} catch (err) {
  if (err instanceof McpError) console.log(`[protocol error] ${err.code} ${err.message} data=${JSON.stringify(err.data)}`);
  else throw err;
} finally {
  await client.close();
}
