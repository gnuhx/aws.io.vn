// pnpm size-audit — gọi MỌI tool với tham số xấu nhất trên dữ liệu lớn, đo phần host đưa vào context. Thoát 1 nếu tool nào > ngân sách.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL, type ToolName } from "@nexus/shared";
import { Tiktoken } from "js-tiktoken/lite";
import o200k from "js-tiktoken/ranks/o200k_base";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMemoryCustomerRepository } from "../src/customers/memory-repository.ts";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { helpdeskFromEnv, memoryQueryStore, type Deps } from "../src/deps.ts";
import { openRoot } from "../src/files/safe-path.ts";
import { createLogger } from "../src/log.ts";
import { createMemoryOrderRepository } from "../src/orders/repository.ts";
import { createMemoryTaskRepository } from "../src/tasks/memory-repository.ts";
import { seedTasks } from "../src/tasks/seed-data.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { createRatesClient } from "../src/rates/client.ts";
import { createServer } from "../src/server.ts";
import { startHelpdeskStub } from "./stub/helpdesk.ts";

const BUDGET = 25_000; // token / 1 kết quả tool (roadmap M5 · S5.4)
const enc = new Tiktoken(o200k); // ước lượng: tokenizer o200k_base, không phải tokenizer của mọi model

// ---------- dữ liệu xấu nhất: lớn hơn dữ liệu mẫu hàng trăm lần ----------
const seed = seedCustomers(10_000);
const customers = createMemoryCustomerRepository(seed);
const orders = createMemoryOrderRepository(seedOrders(seed, 50_000));
const tasks = createMemoryTaskRepository(seedTasks(100_000));
const exportsDir = await openRoot(path.join(await mkdtemp(path.join(tmpdir(), "nexus-audit-")), "exports"));
await mkdir(path.join(exportsDir, "bulk"), { recursive: true });
for (let i = 0; i < 300; i++) await writeFile(path.join(exportsDir, "bulk", `bao-cao-${String(i).padStart(3, "0")}.txt`), "x");
await writeFile(path.join(exportsDir, "dai.txt"), "Nội dung rất dài có dấu tiếng Việt. ".repeat(20_000));
const csv = ["ma,nhom,so_tien", ...Array.from({ length: 20_000 }, (_, i) => `r${i},nhom-${i},${(i % 97) * 1000}`)].join("\n");
await writeFile(path.join(exportsDir, "lon.csv"), csv);
const stub = await startHelpdeskStub({ port: 0, token: "t", capacity: 1_000, refillPerSec: 1_000 });
const log = createLogger("error");

const deps: Deps = {
  log,
  customers,
  orders,
  tasks,
  query: memoryQueryStore(customers, orders, tasks),
  rates: createRatesClient("http://127.0.0.1:9", 300),
  exportsDir,
  helpdesk: helpdeskFromEnv({ HELPDESK_URL: `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`, HELPDESK_TOKEN: "t" }, log),
  close: async () => undefined,
};

/** Record<ToolName, …>: thêm tool mới mà quên kịch bản xấu nhất → lỗi compile, không phải quên âm thầm. */
const WORST: Record<ToolName, Record<string, unknown>> = {
  [TOOL.ping]: {},
  [TOOL.getTime]: {},
  [TOOL.listCustomers]: { limit: 50 },
  [TOOL.getCustomer]: { id: "cus_001" },
  [TOOL.getExchangeRate]: { from: "USD" },
  [TOOL.chartCustomersByCity]: {},
  [TOOL.updateCustomerTier]: { id: "cus_002", tier: "enterprise" },
  [TOOL.deleteCustomer]: { id: "cus_003" },
  [TOOL.generateReport]: {},
  [TOOL.searchCustomers]: { query: "khach", limit: 100 },
  [TOOL.listExports]: {},
  [TOOL.readExport]: { path: "dai.txt", maxBytes: 32_000 },
  [TOOL.exportCustomers]: { filename: "tat-ca.csv" },
  [TOOL.query]: { collection: "customers", filter: {}, limit: 50 },
  [TOOL.listTickets]: { limit: 50 },
  [TOOL.createTicket]: { customerId: "cus_001", subject: "Kiểm tra kích thước", body: "x".repeat(2_000) },
  [TOOL.revenueBy]: { by: "month", top: 24 },
  [TOOL.findOrders]: { sample: 20 },
  [TOOL.analyzeExport]: { path: "lon.csv", groupBy: "nhom", sum: "so_tien", top: 30 },
  [TOOL.listTasks]: { limit: 50 },
  [TOOL.createTask]: { title: "Kiểm tra kích thước ".repeat(6).trim(), assignee: "lan", customerId: "cus_001", dueDate: "2026-12-31" },
  [TOOL.updateTask]: { id: "task_0001", status: "done", assignee: "minh", dueDate: null },
  [TOOL.deleteTask]: { id: "task_0002" },
};

/** Đúng cách host Nexus web (M4) ghép kết quả tool thành chuỗi cho LLM. */
function toText(r: CallToolResult): { text: string; images: number } {
  let images = 0;
  const text = r.content
    .map((c) => {
      if (c.type === "text") return c.text;
      if (c.type === "resource_link") return `[resource_link] ${c.uri} ${c.title ?? c.name}`;
      if (c.type === "image") {
        images++;
        return "[image]";
      }
      return `[${c.type}]`;
    })
    .join("\n");
  return { text, images };
}

const server = createServer(deps);
const [ct, st] = InMemoryTransport.createLinkedPair();
await server.connect(st);
const client = new Client({ name: "size-audit", version: "1.0.0" });
await client.connect(ct);

const { tools } = await client.listTools();
console.log(`dữ liệu: ${seed.length} khách · 50000 đơn · 100000 việc · 301 file export · CSV 20000 dòng · 40 ticket · ngân sách ${BUDGET} token`);
console.log(`${"tool".padEnd(32)} ${"ký tự".padStart(7)} ${"token".padStart(7)} ${"+structured".padStart(12)}  kết luận`);
let over = 0;
const rows: Array<[string, number, number, number, string]> = [];
for (const t of tools) {
  const args = WORST[t.name as ToolName];
  const r = (await client.callTool({ name: t.name, arguments: args })) as CallToolResult;
  const { text, images } = toText(r);
  const tokens = enc.encode(text).length;
  const both = tokens + (r.structuredContent ? enc.encode(JSON.stringify(r.structuredContent)).length : 0);
  const ok = both <= BUDGET;
  if (!ok) over++;
  rows.push([t.name, text.length, tokens, both, `${ok ? "✓" : "✗ VƯỢT"}${r.isError ? " (isError)" : ""}${images ? ` + ${images} ảnh` : ""}`]);
}
rows.sort((a, b) => b[3] - a[3]);
for (const [name, chars, tokens, both, verdict] of rows) {
  console.log(`${name.padEnd(32)} ${String(chars).padStart(7)} ${String(tokens).padStart(7)} ${String(both).padStart(12)}  ${verdict}`);
}
await client.close();
stub.server.close();
console.log(over === 0 ? `OK: ${tools.length} tool, lớn nhất ${rows[0]?.[3]} token` : `${over} tool vượt ngân sách`);
process.exit(over === 0 ? 0 : 1);
