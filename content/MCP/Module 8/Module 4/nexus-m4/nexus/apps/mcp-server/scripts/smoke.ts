// Smoke test qua MCP client THẬT (stdio, NEXUS_DATA=memory). Luật thiết kế + gọi thử từng tool.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ResourceUpdatedNotificationSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PROMPT, RESOURCE, TOOL, customerUri } from "@nexus/shared";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [new URL("../src/index.ts", import.meta.url).pathname],
  env: { ...(process.env as Record<string, string>), NEXUS_DATA: "memory", LOG_LEVEL: "error", RATES_API_URL: "http://127.0.0.1:9/v6" },
  stderr: "inherit",
});
const client = new Client({ name: "nexus-smoke", version: "0.3.0" });
await client.connect(transport);

let failures = 0;
const bad = (msg: string): void => {
  failures++;
  console.log(`✗ ${msg}`);
};

// ---- luật thiết kế trên tools/list ----
const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);
for (const t of tools) {
  if (!t.name.startsWith("nexus_")) bad(`tool thiếu prefix nexus_: ${t.name}`);
  if (!t.outputSchema) bad(`tool thiếu outputSchema: ${t.name}`);
  const a = t.annotations ?? {};
  if (a.readOnlyHint === undefined) bad(`tool thiếu readOnlyHint: ${t.name}`);
  if (a.readOnlyHint === false && a.destructiveHint !== true) bad(`tool ghi thiếu destructiveHint: ${t.name}`);
}

// ---- gọi thử ----
type Case = [name: string, args: Record<string, unknown>, expectError: boolean];
const CASES: Case[] = [
  [TOOL.ping, {}, false],
  [TOOL.getTime, {}, false],
  [TOOL.getTime, { timeZone: "Hanoi" }, true],
  [TOOL.listCustomers, {}, false],
  [TOOL.listCustomers, { city: "Hà Nội", limit: 5 }, false],
  [TOOL.listCustomers, { limit: 500 }, true],
  [TOOL.getCustomer, { id: "cus_007" }, false],
  [TOOL.getCustomer, { id: "007" }, true],
  [TOOL.getCustomer, { id: "cus_999" }, true],
  [TOOL.getExchangeRate, { base: "USD" }, true], // cổng 9 đóng → lỗi mạng có chủ đích
  [TOOL.chartCustomersByCity, {}, false],
  [TOOL.updateCustomerTier, { id: "cus_002", tier: "pro" }, false],
  [TOOL.deleteCustomer, { id: "cus_030" }, false],
  [TOOL.deleteCustomer, { id: "cus_030" }, false],
  [TOOL.searchCustomers, { query: "cà phê" }, false],
  [TOOL.searchCustomers, { query: "không-có-ai" }, true],
];
for (const [name, args, expectError] of CASES) {
  const res = (await client.callTool({ name, arguments: args })) as CallToolResult;
  const isError = res.isError === true;
  const first = res.content[0];
  const text = first?.type === "text" ? first.text.slice(0, 70) : first?.type ?? "(rỗng)";
  const mark = isError === expectError ? "✓" : "✗";
  if (isError !== expectError) failures++;
  console.log(`${mark} ${name} ${JSON.stringify(args)} → ${isError ? "isError" : "ok"}: ${text}`);
}

let progressEvents = 0;
await client.callTool({ name: TOOL.generateReport, arguments: {} }, undefined, { onprogress: () => void progressEvents++ });
console.log(`${progressEvents === 6 ? "✓" : "✗"} ${TOOL.generateReport} → progress events: ${progressEvents}`);
if (progressEvents !== 6) failures++;

// ---- M4: resources ----
const check = (ok: boolean, msg: string): void => {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
};
const { resources } = await client.listResources();
check(resources.some((r) => r.uri === RESOURCE.glossary), `resources/list (${resources.length}) có ${RESOURCE.glossary}`);
const glossary = await client.readResource({ uri: RESOURCE.glossary });
const gtext = glossary.contents[0] && "text" in glossary.contents[0] ? glossary.contents[0].text : "";
check(gtext.includes("MRR"), `resources/read glossary → ${gtext.length} ký tự`);
const cus = await client.readResource({ uri: customerUri("cus_007") });
check(cus.contents[0]?.mimeType === "application/json", `resources/read ${customerUri("cus_007")} → application/json`);
const miss = await client.readResource({ uri: customerUri("cus_999") }).then(
  () => ({ code: 0, data: undefined }),
  (e: { code?: number; data?: unknown }) => ({ code: e.code ?? 0, data: e.data }),
);
check(miss.code === -32602 && JSON.stringify(miss.data) === JSON.stringify({ uri: customerUri("cus_999") }),
  `resources/read ${customerUri("cus_999")} → JSON-RPC error ${miss.code} data=${JSON.stringify(miss.data)}`);
const chart = await client.readResource({ uri: RESOURCE.customersByCityChart });
const blob = chart.contents[0] && "blob" in chart.contents[0] ? chart.contents[0].blob : "";
check(blob.startsWith("iVBOR"), `resources/read chart → blob ${blob.length} ký tự, image/png`);

// ---- M4: subscribe → updated; unsubscribe → im lặng ----
const updated: string[] = [];
client.setNotificationHandler(ResourceUpdatedNotificationSchema, (n) => void updated.push(n.params.uri));
await client.subscribeResource({ uri: customerUri("cus_007") });
await client.callTool({ name: TOOL.updateCustomerTier, arguments: { id: "cus_007", tier: "enterprise" } });
await new Promise((r) => setTimeout(r, 50));
check(updated.includes(customerUri("cus_007")), `subscribe cus_007 + đổi gói → updated: ${updated.join(", ")}`);
await client.unsubscribeResource({ uri: customerUri("cus_007") });
updated.length = 0;
await client.callTool({ name: TOOL.updateCustomerTier, arguments: { id: "cus_007", tier: "pro" } });
await new Promise((r) => setTimeout(r, 50));
check(updated.length === 0, `unsubscribe → không nhận thông báo (${updated.length})`);

// ---- M4: prompts ----
const { prompts } = await client.listPrompts();
const weekly = prompts.find((p) => p.name === PROMPT.weeklySummary);
const lang = weekly?.arguments?.find((a) => a.name === "language");
check(lang?.required === false, `${PROMPT.weeklySummary}: language required=${String(lang?.required)}`);
const got = await client.getPrompt({ name: PROMPT.weeklySummary, arguments: { team: "sales" } });
check(got.messages.length === 2, `prompts/get team=sales (không language) → ${got.messages.length} message · ${got.description ?? ""}`);

await client.close();
console.log(failures === 0 ? "smoke: OK" : `smoke: ${failures} lỗi`);
process.exit(failures === 0 ? 0 : 1);
