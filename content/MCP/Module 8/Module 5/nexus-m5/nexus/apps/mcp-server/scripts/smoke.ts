// pnpm smoke — server thật + client thật qua InMemoryTransport, dữ liệu RAM. Thoát 1 nếu có ✗.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ResourceUpdatedNotificationSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PROMPT, RESOURCE, TOOL, customerUri } from "@nexus/shared";
import { createMemoryCustomerRepository } from "../src/customers/memory-repository.ts";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { helpdeskFromEnv, memoryQueryStore, type Deps } from "../src/deps.ts";
import { createMemoryOrderRepository } from "../src/orders/repository.ts";
import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
import { seedTasks } from "../src/tasks/seed-data.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { createLogger } from "../src/log.ts";
import { createRatesClient } from "../src/rates/client.ts";
import { createServer } from "../src/server.ts";
import { openRoot } from "../src/files/safe-path.ts";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let failed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) failed++;
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
};

const seed = seedCustomers();
const customers = createMemoryCustomerRepository(seed);
const orders = createMemoryOrderRepository(seedOrders(seed));
const tasks = createMemoryTaskRepository(seedTasks());
const deps: Deps = {
  log: createLogger("error"),
  customers,
  orders,
  tasks,
  query: memoryQueryStore(customers, orders, tasks),
  helpdesk: helpdeskFromEnv({ HELPDESK_URL: "http://127.0.0.1:9", HELPDESK_TOKEN: undefined }, createLogger("error")),
  rates: createRatesClient("http://127.0.0.1:9", 500),
  exportsDir: await openRoot(await mkdtemp(path.join(tmpdir(), "nexus-smoke-"))),
  close: async () => undefined,
};
const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(ct);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);
const noOut = tools.filter((t) => t.name !== TOOL.chartCustomersByCity && !t.outputSchema).map((t) => t.name);
ok(noOut.length === 0, `mọi tool có outputSchema${noOut.length ? ` — thiếu: ${noOut.join(", ")}` : ""}`);
ok(tools.every((t) => t.annotations?.readOnlyHint !== undefined), "mọi tool có readOnlyHint");

const call = async (name: string, args: Record<string, unknown>): Promise<CallToolResult> =>
  (await client.callTool({ name, arguments: args })) as CallToolResult;
const hn = await call(TOOL.listCustomers, { city: "Hà Nội" });
ok((hn.structuredContent as { total?: number } | undefined)?.total === 12, "nexus_list_customers Hà Nội → total 12");

const { resources } = await client.listResources();
ok(resources.some((r) => r.uri === RESOURCE.glossary), `resources/list (${resources.length}) có ${RESOURCE.glossary}`);
const g = await client.readResource({ uri: RESOURCE.glossary });
const gText = g.contents[0] && "text" in g.contents[0] ? g.contents[0].text : "";
ok(gText.length > 500, `resources/read glossary → ${gText.length} ký tự`);

const p = await client.getPrompt({ name: PROMPT.weeklySummary, arguments: { team: "sales" } });
ok(p.messages.length === 2, `prompts/get ${PROMPT.weeklySummary} → ${p.messages.length} message`);

const got: string[] = [];
client.setNotificationHandler(ResourceUpdatedNotificationSchema, (n) => {
  got.push(n.params.uri);
});
await client.subscribeResource({ uri: customerUri("cus_007") });
await call(TOOL.updateCustomerTier, { id: "cus_007", tier: "enterprise" });
await new Promise((r) => setTimeout(r, 20));
ok(got.includes(customerUri("cus_007")), "subscribe cus_007 + đổi gói → updated");
await client.unsubscribeResource({ uri: customerUri("cus_007") });
await call(TOOL.updateCustomerTier, { id: "cus_007", tier: "pro" });
await new Promise((r) => setTimeout(r, 20));
ok(got.length === 1, "unsubscribe → im lặng");

// ---------- M5 ----------
const text = (r: CallToolResult): string => r.content.map((c) => (c.type === "text" ? c.text : "")).join("");
const trav = await call(TOOL.readExport, { path: "../../etc/passwd" });
ok(trav.isError === true && !text(trav).includes("root:"), "nexus_read_export ../../etc/passwd → bị chặn");
const where = await call(TOOL.query, { collection: "customers", filter: { $where: "1" } });
ok(where.isError === true, "nexus_query $where → bị từ chối");
const rev = await call(TOOL.revenueBy, { by: "product" });
ok((rev.structuredContent as { totalRevenue?: number } | undefined)?.totalRevenue === 9_072_400_000, "nexus_revenue_by product → tổng 9.072.400.000");
let cursor: string | undefined;
let seen = 0;
for (;;) {
  const p = (await call(TOOL.listTasks, { limit: 50, ...(cursor ? { cursor } : {}) })).structuredContent as { returned: number; hasMore: boolean; nextCursor?: string };
  seen += p.returned;
  if (!p.hasMore) break;
  cursor = p.nextCursor;
}
ok(seen === 1000, `nexus_list_tasks qua cursor → ${seen} việc`);
const { resources: all } = await client.listResources();
ok(all.some((r) => r.uri === RESOURCE.schema), "resources/list có nexus://schema");

await client.close();
await server.close();
console.log(failed === 0 ? "smoke: OK" : `smoke: ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
