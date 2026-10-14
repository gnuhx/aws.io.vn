/**
 * Cursor v2: phân biệt "không hợp lệ" với "hết hạn" — 9 tình huống qua server + client SDK thật, đồng hồ giả.
 *   node scripts/cursor-probe.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { TOOL } from "@nexus/shared";
import { createDeps } from "../src/deps.ts";
import { loadEnv } from "../src/env.ts";
import { createServer } from "../src/server.ts";

let now = new Date("2026-10-09T07:00:00Z");
async function start(secret: string): Promise<Client> {
  const deps = createDeps(loadEnv({ NEXUS_LOG_LEVEL: "error", NEXUS_CURSOR_SECRET: secret, NEXUS_CURSOR_TTL_S: "900" }), { now: () => now });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await createServer(deps).connect(st);
  const c = new Client({ name: "cursor-probe", version: "0.6.0" });
  await c.connect(ct);
  return c;
}
const nexus = await start("khoa-ky-cursor-cua-nexus-0123456789");
const restarted = await start("khoa-khac-sau-khi-restart-9876543210"); // như restart mà không đặt NEXUS_CURSOR_SECRET

type Page = { items: { id: string }[]; hasMore: boolean; nextCursor?: string };
let failed = 0;
async function list(client: Client, args: Record<string, unknown>, label: string, expect: "ok" | RegExp): Promise<Page | undefined> {
  const r = await client.callTool({ name: TOOL.listTasks, arguments: { assignee: "lan", limit: 5, ...args } });
  const text = (r.content as { type: string; text?: string }[]).map((c) => c.text ?? "").join(" ");
  const pass = expect === "ok" ? !r.isError : r.isError === true && expect.test(text);
  if (!pass) failed++;
  const page = r.isError ? undefined : (r.structuredContent as Page);
  const shown = page ? `${page.items.map((t) => t.id).join(" ")}${page.nextCursor ? " · có nextCursor" : ""}` : `[isError] ${text.slice(0, 64)}…`;
  console.log(`${pass ? "✓" : "✗"} ${label.padEnd(40)} ${shown}`);
  return page;
}

const p1 = await list(nexus, {}, "1. trang đầu", "ok");
const c1 = p1?.nextCursor ?? "";
const [payload = "", sig = ""] = c1.split(".");
console.log(`   cursor ${c1.length} ký tự; payload = ${Buffer.from(payload, "base64url").toString()}`);
await list(nexus, { cursor: c1 }, "2. trang 2 bằng nextCursor", "ok");

const flip = (s: string, i: number): string => s.slice(0, i) + (s[i] === "A" ? "B" : "A") + s.slice(i + 1);
await list(nexus, { cursor: `${payload}.${flip(sig, 5)}` }, "3. sửa 1 ký tự chữ ký", /không hợp lệ/);
const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
const longer = Buffer.from(JSON.stringify({ ...body, exp: body.exp + 86_400 })).toString("base64url");
await list(nexus, { cursor: `${longer}.${sig}` }, "4. tự gia hạn exp +1 ngày", /không hợp lệ/);
await list(restarted, { cursor: c1 }, "5. server khác khóa (restart)", /không hợp lệ/);
const v1 = Buffer.from(JSON.stringify({ v: 1, c: "2026-07-01T00:00:00.000Z", i: "task_0006", f: "abcdefghijkl" })).toString("base64url");
await list(nexus, { cursor: v1 }, "6. cursor định dạng M5 (v1)", /không hợp lệ/);
await list(nexus, { cursor: c1, status: "todo" }, "7. đổi bộ lọc, giữ cursor", /bộ lọc khác/);
now = new Date(now.getTime() + 16 * 60_000);
await list(nexus, { cursor: c1 }, "8. 16 phút sau (TTL 15 phút)", /hết hạn/);
await list(nexus, {}, "9. sau khi hết hạn: gọi lại không cursor", "ok");

await nexus.close();
await restarted.close();
console.log(failed ? `FAILED: ${failed}` : "OK: 9/9 đúng như mong đợi");
process.exit(failed ? 1 : 0);
