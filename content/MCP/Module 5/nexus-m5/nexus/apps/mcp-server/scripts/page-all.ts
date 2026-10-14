// node scripts/page-all.ts — duyệt 1000 việc qua nexus_list_tasks bằng cursor (server thật, stdio): không trùng, không sót.
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL, type Task } from "@nexus/shared";
import { connect } from "./client.ts";

interface Page {
  items: Task[];
  hasMore: boolean;
  nextCursor?: string;
}

async function call(c: Client, name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  return (await c.callTool({ name, arguments: args })) as CallToolResult;
}
async function page(c: Client, args: Record<string, unknown>): Promise<Page> {
  const r = await call(c, TOOL.listTasks, args);
  if (r.isError) throw new Error(r.content.map((x) => (x.type === "text" ? x.text : "")).join(""));
  return r.structuredContent as unknown as Page;
}

/** Đi hết các trang; onPage chạy sau mỗi trang (để chen thay đổi vào giữa chừng). */
async function walk(c: Client, filter: Record<string, unknown>, limit: number, onPage?: (n: number) => Promise<void>): Promise<{ ids: string[]; pages: number; lastHasCursor: boolean }> {
  const ids: string[] = [];
  let cursor: string | undefined;
  let pages = 0;
  for (;;) {
    const p = await page(c, { ...filter, limit, ...(cursor ? { cursor } : {}) });
    pages++;
    ids.push(...p.items.map((t) => t.id));
    await onPage?.(pages);
    if (!p.hasMore) return { ids, pages, lastHasCursor: p.nextCursor !== undefined };
    cursor = p.nextCursor;
  }
}

const report = (label: string, ids: string[], expected: ReadonlySet<string>): void => {
  const seen = new Set(ids);
  const dup = ids.length - seen.size;
  const missing = [...expected].filter((id) => !seen.has(id)).length;
  console.log(`${dup === 0 && missing === 0 ? "✓" : "✗"} ${label}: nhận ${ids.length} · trùng ${dup} · sót ${missing}`);
};

const c = await connect();

// 1 · Duyệt hết, không lọc
const t0 = performance.now();
const all = await walk(c, {}, 37);
const universe = new Set(all.ids);
console.log(`1 · không lọc, limit 37: ${all.pages} trang · ${Math.round(performance.now() - t0)} ms · trang cuối có nextCursor: ${all.lastHasCursor}`);
report("   so với 1000 id task_0001…task_1000", all.ids, new Set(Array.from({ length: 1000 }, (_, i) => `task_${String(i + 1).padStart(4, "0")}`)));

// 2 · Có lọc — đối chiếu với nexus_query (đếm bằng matched)
const filter = { assignee: "lan", status: "todo" };
const lan = await walk(c, filter, 10);
const q = await call(c, TOOL.query, { collection: "tasks", filter, limit: 1 });
console.log(`2 · lọc ${JSON.stringify(filter)}: ${lan.pages} trang · ${lan.ids.length} việc · nexus_query matched = ${(q.structuredContent as { matched: number }).matched}`);

// 3 · Dữ liệu đổi GIỮA lúc duyệt: sau trang 2 xóa 3 việc đã đọc + 3 việc chưa đọc, tạo 4 việc mới
const deleted = ["task_0001", "task_0010", "task_0020", "task_0500", "task_0750", "task_0999"];
const created: string[] = [];
const live = await walk(c, {}, 50, async (n) => {
  if (n !== 2) return;
  for (const id of deleted) await call(c, TOOL.deleteTask, { id });
  for (let i = 0; i < 4; i++) {
    const r = await call(c, TOOL.createTask, { title: `Việc mới ${i + 1} trong lúc duyệt`, assignee: "minh" });
    created.push((r.structuredContent as { task: Task }).task.id);
  }
});
const stillThere = new Set([...universe].filter((id) => !deleted.slice(3).includes(id)));
for (const id of created) stillThere.add(id);
report(`3 · xóa ${deleted.length} + tạo ${created.length} giữa chừng (limit 50)`, live.ids, stillThere);

// 4 · Cursor sai
const first = await page(c, { limit: 5 });
const bad = await call(c, TOOL.listTasks, { limit: 5, cursor: `${first.nextCursor ?? ""}x` });
const other = await call(c, TOOL.listTasks, { limit: 5, status: "done", ...(first.nextCursor ? { cursor: first.nextCursor } : {}) });
const text = (r: CallToolResult): string => r.content.map((x) => (x.type === "text" ? x.text : "")).join("");
console.log(`4 · cursor bị sửa 1 ký tự → ${bad.isError ? "[isError] " : ""}${text(bad)}`);
console.log(`    cursor của bộ lọc khác  → ${other.isError ? "[isError] " : ""}${text(other)}`);
console.log(`    nextCursor trông thế này: ${first.nextCursor}`);
await c.close();
