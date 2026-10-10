// node scripts/prompt.ts <prompt> '<json args>'
import { connect } from "./client.ts";

const [name, json = "{}"] = process.argv.slice(2);
if (!name) process.exit(2);
const client = await connect();
try {
  const res = await client.getPrompt({ name, arguments: JSON.parse(json) as Record<string, string> });
  console.log(`description: ${res.description ?? "—"}`);
  for (const m of res.messages) {
    const c = m.content;
    console.log(`[${m.role}] ${c.type === "text" ? c.text : c.type === "resource" ? `resource ${c.resource.uri}` : c.type}`);
  }
} catch (err) {
  console.log(`[protocol error] ${err instanceof Error ? err.message : String(err)}`);
} finally {
  await client.close();
}
