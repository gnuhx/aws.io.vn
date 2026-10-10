/** Smoke test: client SDK thật ↔ server thật qua InMemoryTransport. node scripts/smoke.ts */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { PROMPT, RESOURCE, TOOL } from "@nexus/shared";
import { createDeps } from "../src/deps.ts";
import { loadEnv } from "../src/env.ts";
import { createServer } from "../src/server.ts";

const deps = createDeps(loadEnv({ NEXUS_LOG_LEVEL: "warn" }));
const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "nexus-smoke", version: "0.5.0" });
await client.connect(ct);

let failed = 0;
const check = (ok: boolean, label: string): void => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed++;
};
const data = (r: Awaited<ReturnType<typeof client.callTool>>): Record<string, unknown> =>
  (r.structuredContent ?? {}) as Record<string, unknown>;

const tools = await client.listTools();
check(tools.tools.length === Object.keys(TOOL).length, `tools/list → ${tools.tools.length} tool`);
check(data(await client.callTool({ name: TOOL.ping })).pong === true, `${TOOL.ping}`);
const rev = data(await client.callTool({ name: TOOL.revenueBy, arguments: { by: "month" } }));
check(typeof rev.totalRevenue === "number" && rev.totalRevenue > 0, `${TOOL.revenueBy} by=month → ${String(rev.totalRevenue)}`);

let cursor: string | undefined;
let seen = 0;
do {
  const page = data(await client.callTool({ name: TOOL.listTasks, arguments: { limit: 50, ...(cursor ? { cursor } : {}) } }));
  seen += (page.items as unknown[]).length;
  cursor = page.nextCursor as string | undefined;
} while (cursor);
check(seen === 1000, `${TOOL.listTasks} qua cursor → ${seen} việc`);

const en = data(await client.callTool({ name: TOOL.enrichCustomer, arguments: { id: "cus_026" } }));
check(en.source === "rules", `${TOOL.enrichCustomer} (client không có sampling) → source=${String(en.source)}`);

const g = await client.readResource({ uri: RESOURCE.glossary });
check(g.contents.length === 1, `resources/read ${RESOURCE.glossary}`);
const p = await client.getPrompt({ name: PROMPT.weeklySummary, arguments: { team: "sales" } });
check(p.messages.length === 2, `prompts/get ${PROMPT.weeklySummary} → ${p.description ?? ""}`);

await client.close();
console.log(failed ? `FAILED: ${failed}` : "OK: smoke xanh");
process.exit(failed ? 1 : 0);
