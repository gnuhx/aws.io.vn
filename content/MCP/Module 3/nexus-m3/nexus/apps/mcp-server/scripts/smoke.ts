/**
 * Smoke test qua MCP client THẬT của SDK: spawn server bằng stdio, liệt kê tool, gọi từng tool, so với kỳ vọng.
 *   node scripts/smoke.ts      (NEXUS_DATA=memory + rates-stub tự bật — không cần Mongo, không cần mạng)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOL } from "@nexus/shared";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const stub = spawn(process.execPath, [here("./rates-stub.ts"), "4011"], { stdio: ["ignore", "ignore", "pipe"] });
await once(stub.stderr, "data");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [here("../src/index.ts")],
  env: { NEXUS_DATA: "memory", LOG_LEVEL: "warn", RATES_API_URL: "http://127.0.0.1:4011/ok/v6", PATH: process.env["PATH"] ?? "" },
  stderr: "ignore",
});
const client = new Client({ name: "nexus-smoke", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).join(", ")}`);
const unprefixed = tools.filter((t) => !t.name.startsWith("nexus_"));
const noOutput = tools.filter((t) => !t.outputSchema);
const writeNotDestructive = tools.filter((t) => t.annotations?.readOnlyHint === false && t.annotations.destructiveHint !== true);

type Expect = "ok" | "isError";
const calls: Array<[string, Record<string, unknown>, Expect]> = [
  [TOOL.ping, {}, "ok"],
  [TOOL.getTime, { timeZone: "Hanoi" }, "isError"],
  [TOOL.listCustomers, { city: "ha noi", limit: 2 }, "ok"],
  [TOOL.listCustomers, { limit: 500 }, "isError"],
  [TOOL.getCustomer, { id: "cus_007" }, "ok"],
  [TOOL.getCustomer, { id: "007" }, "isError"],
  [TOOL.getCustomer, { id: "cus_999" }, "isError"],
  [TOOL.getExchangeRate, { base: "usd" }, "ok"],
  [TOOL.getExchangeRate, { base: "XYZ" }, "isError"],
  [TOOL.chartCustomersByCity, {}, "ok"],
  [TOOL.updateCustomerTier, { id: "cus_003", tier: "pro" }, "ok"],
  [TOOL.deleteCustomer, { id: "cus_030" }, "ok"],
  [TOOL.deleteCustomer, { id: "cus_030" }, "ok"],
];
let failed = 0;
for (const [name, args, expect] of calls) {
  const res = await client.callTool({ name, arguments: args });
  const parts = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type} ${c.type === "image" ? c.mimeType : ""}]`)) : [];
  const got: Expect = res.isError ? "isError" : "ok";
  if (got !== expect) failed++;
  console.log(`${got === expect ? "✓" : "✗"} ${res.isError ? "[isError] " : ""}${name} ${JSON.stringify(args)} → ${parts.join(" ").slice(0, 150)}`);
}

let progressEvents = 0;
const report = await client.callTool({ name: TOOL.generateReport, arguments: {} }, undefined, { onprogress: () => void progressEvents++ });
const reportOk = !report.isError && progressEvents === 6;
if (!reportOk) failed++;
console.log(`${reportOk ? "✓" : "✗"} ${TOOL.generateReport} → progress events: ${progressEvents}`);

await client.close();
stub.kill();
const rules: Array<[string, unknown[]]> = [["tool thiếu prefix nexus_", unprefixed], ["tool thiếu outputSchema", noOutput], ["tool ghi thiếu destructiveHint", writeNotDestructive]];
for (const [label, list] of rules) {
  if (list.length) { failed++; console.log(`✗ ${label}: ${list.length}`); }
}
if (failed) {
  console.log(`✗ smoke: ${failed} kiểm tra không đạt`);
  process.exit(1);
}
console.log(`✓ smoke OK — ${calls.length + 1} lần gọi, quy ước tên/outputSchema/annotation đạt`);
