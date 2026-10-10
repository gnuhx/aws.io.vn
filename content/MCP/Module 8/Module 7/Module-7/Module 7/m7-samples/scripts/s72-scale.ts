// S7.2 — 2 instance sau 1 load balancer round-robin: stateless chạy đúng, stateful vỡ. Progress qua HTTP, hủy và mất kết nối.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema, ElicitRequestSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ACCEPT_BOTH, check, roundRobin, startServer, summary } from "./lib.ts";

const data = join(mkdtempSync(join(tmpdir(), "m7-")), "tasks.json");
const inst = (mode: string, port: number, name: string) =>
  startServer({ MODE: mode, PORT: String(port), INSTANCE: name, DATA_FILE: data, ELICIT_TIMEOUT_MS: "1500" });
const field = (r: CallToolResult, k: string): unknown => (r.structuredContent ? r.structuredContent[k] : undefined);
const text = (r: CallToolResult) => (r.content[0]?.type === "text" ? r.content[0].text : "");
const call = async (c: Client, name: string, args: Record<string, unknown>) => CallToolResultSchema.parse(await c.callTool({ name, arguments: args }));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lastLog = (logs: string[], ...keys: string[]) => logs.filter((l) => keys.some((k) => l.includes(k))).at(-1);

console.log("— Stateless × 2 instance, round-robin —");
const [a, b] = await Promise.all([inst("stateless", 3201, "A"), inst("stateless", 3202, "B")]);
const lb = await roundRobin(3200, [3201, 3202]);
const c = new Client({ name: "s72", version: "1" });
await c.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3200/mcp")));
const tools = await c.listTools();
const created = await call(c, "nexus_create_task", { title: "Gọi khách mới ở Đà Nẵng", owner: "lan" });
const listed = await call(c, "nexus_list_tasks", { owner: "lan" });
const titles = z.array(z.object({ title: z.string() })).catch([]).parse(field(listed, "items")).map((t) => t.title);
console.log(`tools/list: ${tools.tools.length} tool`);
console.log(`create → instance ${String(field(created, "instance"))} · list → instance ${String(field(listed, "instance"))} thấy: ${titles.join(" | ")}`);
console.log(`LB: ${lb.hits.join(" · ")}`);
check(field(created, "instance") !== field(listed, "instance") && titles.some((t) => t.includes("Đà Nẵng")), "ghi ở 1 instance, đọc ở instance kia vẫn thấy (store dùng chung)");
check(new Set(lb.hits.map((h) => h.split("→ ")[1])).size === 2, "request rải đều 2 instance");

console.log("\n— Progress qua HTTP (SSE trên response của chính POST đó) —");
const t0 = Date.now();
const marks: string[] = [];
const rep = await c.callTool({ name: "nexus_generate_report", arguments: { steps: 4, delayMs: 250 } }, undefined, {
  onprogress: (p) => void marks.push(`${p.progress}/${p.total} @${Date.now() - t0}ms`),
});
console.log(`progress: ${marks.join(" · ")}`);
console.log(`kết quả @${Date.now() - t0}ms: ${JSON.stringify(rep.structuredContent)}`);
check(marks.length === 4, "4 progress đến TỪNG CÁI trước kết quả");

console.log("\n— Hủy và mất kết nối (report 10 bước × 250 ms) —");
// (1) Client SDK hủy bằng AbortSignal: SDK gửi notifications/cancelled bằng 1 POST MỚI.
lb.hits.length = 0;
const ac = new AbortController();
setTimeout(() => ac.abort(), 600);
await c.callTool({ name: "nexus_generate_report", arguments: { steps: 10, delayMs: 250 } }, undefined, { signal: ac.signal }).catch((e: unknown) => console.log(`(1) client: ${String(e)}`));
await wait(2600);
console.log(`    LB: ${lb.hits.join(" · ")}`);
console.log(`    server: A ${lastLog(a.logs, "report") ?? "—"} · B ${lastLog(b.logs, "report") ?? "—"}`);
check([...a.logs, ...b.logs].some((l) => l.includes("report xong 10/10")), "stateless: cancelled tới server MỚI (không biết request) → tool chạy hết 10 bước");

// (2) Client đóng hẳn kết nối HTTP của POST đang stream.
const raw = new AbortController();
const beforeA = a.logs.length;
setTimeout(() => raw.abort(), 600);
await fetch("http://127.0.0.1:3201/mcp", {
  method: "POST", signal: raw.signal, headers: { ...ACCEPT_BOTH, "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "nexus_generate_report", arguments: { steps: 10, delayMs: 250 } } }),
}).then((r) => r.text()).catch((e: unknown) => console.log(`(2) client đóng kết nối: ${e instanceof Error ? e.name : String(e)}`));
await wait(400);
const stop2 = a.logs.slice(beforeA).find((l) => l.includes("report dừng"));
console.log(`    server: ${stop2 ?? "(không dừng)"}`);
check(stop2 !== undefined, "mất kết nối → res 'close' → transport.close() → signal abort → tool dừng thật");

console.log("\n— Stateless + server hỏi ngược (elicitation) —");
const ce = new Client({ name: "s72-elicit", version: "1" }, { capabilities: { elicitation: {} } });
ce.setRequestHandler(ElicitRequestSchema, async () => ({ action: "accept", content: { confirm: true } }));
await ce.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3201/mcp")));
const del = await call(ce, "nexus_delete_task", { id: "t1" });
console.log(`client khai elicitation lúc initialize · delete t1 → ${del.isError ? "[isError] " : ""}${text(del)}`);
check(del.isError === true, "stateless: server của request này KHÔNG thấy initialize → không biết capability client");
await ce.close();
await c.close();
lb.close();
await Promise.all([a.stop(), b.stop()]);

console.log("\n— Stateful: cùng hủy (1), cùng 1 instance —");
const one = await inst("stateful", 3221, "S");
const cs = new Client({ name: "s72-s", version: "1" });
await cs.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3221/mcp")));
const ac3 = new AbortController();
setTimeout(() => ac3.abort(), 600);
await cs.callTool({ name: "nexus_generate_report", arguments: { steps: 10, delayMs: 250 } }, undefined, { signal: ac3.signal }).catch(() => undefined);
await wait(300);
console.log(`server: ${lastLog(one.logs, "report") ?? "—"}`);
check(one.logs.some((l) => l.includes("report dừng")), "stateful: cancelled tới đúng session → tool dừng");
await cs.close();
await one.stop();

console.log("\n— Stateful × 2 instance, round-robin —");
const [sa, sb] = await Promise.all([inst("stateful", 3211, "A"), inst("stateful", 3212, "B")]);
const lb2 = await roundRobin(3210, [3211, 3212]);
const s = new Client({ name: "s72-stateful", version: "1" });
let err = "";
try {
  await s.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3210/mcp")));
  await s.listTools();
} catch (e) {
  err = e instanceof Error ? e.message : String(e);
}
console.log(`client: ${err || "(không lỗi)"}`);
console.log(`LB: ${lb2.hits.join(" · ")}`);
check(err.includes("Session not found"), "stateful sau round-robin: session tạo ở A, request kế rơi vào B → 404");
await s.close().catch(() => undefined);
lb2.close();
await Promise.all([sa.stop(), sb.stop()]);
summary("S7.2");
