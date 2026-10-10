/**
 * Bộ chấm cho Nexus server — viết theo đúng cách harness C50 chấm bài bạn (Lab 29): spawn server,
 * bắt tay, liệt kê, gọi, kiểm từng hợp đồng. Không import gì từ apps/mcp-server: chỉ nói chuyện qua giao thức.
 *
 *   node scripts/grade.ts [--server "node đường/dẫn/server.ts"]
 */
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { parseArgs } from "node:util";
import { NEXUS_SERVER, parseServerSpec, withClient, type Session } from "../src/connect.ts";

const { values } = parseArgs({ options: { server: { type: "string" } } });
const spec = values.server ? parseServerSpec(values.server) : NEXUS_SERVER;

type Verdict = true | string; // true = đạt, chuỗi = lý do trượt
interface Check {
  name: string;
  run(s: Session, tools: Tool[]): Promise<Verdict>;
}

async function call(s: Session, name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const r = await s.client.callTool({ name, arguments: args });
  if ("toolResult" in r) throw new Error("định dạng 2024-10-07 không hỗ trợ");
  return r;
}
const text = (r: CallToolResult): string => r.content.map((c) => (c.type === "text" ? c.text : `<${c.type}>`)).join(" ");

const CHECKS: Check[] = [
  {
    name: "initialize: khai báo tools, resources, prompts, completions",
    async run(s) {
      const c = s.client.getServerCapabilities() ?? {};
      const miss = (["tools", "resources", "prompts", "completions"] as const).filter((k) => c[k] === undefined);
      return miss.length === 0 || `thiếu capability: ${miss.join(", ")}`;
    },
  },
  {
    name: "mọi tool có description ≥ 40 ký tự (nói khi nào nên gọi)",
    async run(_s, tools) {
      const bad = tools.filter((t) => (t.description ?? "").length < 40).map((t) => t.name);
      return bad.length === 0 || `description quá ngắn: ${bad.join(", ")}`;
    },
  },
  {
    name: "mọi tool khai báo readOnlyHint; tool xóa có destructiveHint",
    async run(_s, tools) {
      const noHint = tools.filter((t) => t.annotations?.readOnlyHint === undefined).map((t) => t.name);
      const delNoD = tools.filter((t) => /delete|remove/.test(t.name) && t.annotations?.destructiveHint !== true).map((t) => t.name);
      if (noHint.length) return `thiếu readOnlyHint: ${noHint.join(", ")}`;
      return delNoD.length === 0 || `thiếu destructiveHint: ${delNoD.join(", ")}`;
    },
  },
  {
    name: "input sai → kết quả isError chứa -32602 (callTool KHÔNG ném)",
    async run(s) {
      const r = await call(s, "nexus_get_customer", { id: "khach-7" });
      return (r.isError === true && text(r).includes("-32602")) || `nhận: ${JSON.stringify(r).slice(0, 120)}`;
    },
  },
  {
    name: "tool không tồn tại → isError “not found”",
    async run(s) {
      const r = await call(s, "nexus_khong_co", {});
      return (r.isError === true && /not found/.test(text(r))) || `nhận: ${text(r).slice(0, 120)}`;
    },
  },
  {
    name: "lỗi nghiệp vụ có hướng dẫn bước tiếp (nhắc tool khác)",
    async run(s) {
      const r = await call(s, "nexus_get_customer", { id: "cus_999" });
      return (r.isError === true && /nexus_\w+/.test(text(r))) || `nhận: ${text(r).slice(0, 120)}`;
    },
  },
  {
    name: "phân trang: 1000 id duy nhất, trang cuối không có nextCursor",
    async run(s) {
      const ids = new Set<string>();
      let cursor: string | undefined;
      let pages = 0;
      let last: Record<string, unknown> = {};
      do {
        const r = await call(s, "nexus_list_tasks", { limit: 37, ...(cursor ? { cursor } : {}) });
        last = (r.structuredContent ?? {}) as Record<string, unknown>;
        for (const t of last.items as { id: string }[]) ids.add(t.id);
        cursor = last.nextCursor as string | undefined;
        pages++;
      } while (cursor && pages < 100);
      if ("nextCursor" in last) return "trang cuối vẫn có field nextCursor";
      return ids.size === 1000 || `nhận ${ids.size} id duy nhất qua ${pages} trang`;
    },
  },
  {
    name: "tool xóa: client không hỏi được người dùng → không xóa",
    async run(s) {
      const r = await call(s, "nexus_delete_task", { id: "task_0001" });
      const still = await call(s, "nexus_list_tasks", { assignee: "lan", limit: 50 });
      const ids = ((still.structuredContent ?? {}) as { items?: { id: string }[] }).items?.map((t) => t.id) ?? [];
      return (r.isError === true && ids.includes("task_0001")) || `isError=${String(r.isError)}, còn task_0001: ${ids.includes("task_0001")}`;
    },
  },
  {
    name: "completion: lọc theo chữ đang gõ",
    async run(s) {
      const r = await s.client.complete({ ref: { type: "ref/prompt", name: "nexus_weekly_summary" }, argument: { name: "team", value: "s" } });
      const v = r.completion.values;
      return (v.length === 1 && v[0] === "sales") || `"s" → ${JSON.stringify(v)}`;
    },
  },
];

let transportErrors = 0;
// dòng không phải JSON-RPC trên stdout → lỗi parse ở tầng transport; gắn trước connect để không lỡ lúc bắt tay
const passed = await withClient(spec, { name: "nexus-grader", onError: () => void transportErrors++ }, async (s) => {
  const { tools } = await s.client.listTools();
  let ok = 0;
  for (const c of CHECKS) {
    const t0 = performance.now();
    let v: Verdict;
    try {
      v = await c.run(s, tools);
    } catch (e) {
      v = `ném: ${e instanceof Error ? e.message : String(e)}`;
    }
    const ms = Math.round(performance.now() - t0);
    console.log(v === true ? `✓ ${c.name} (${ms} ms)` : `✗ ${c.name}\n    → ${v}`);
    if (v === true) ok++;
  }
  return ok;
}); // withClient: phiên đóng ở đây dù check nào ném
const clean = transportErrors === 0;
console.log(clean ? "✓ stdout sạch: 0 lỗi parse JSON-RPC" : `✗ stdout bẩn: ${transportErrors} lỗi parse`);
const total = CHECKS.length + 1;
const score = passed + (clean ? 1 : 0);
console.log(`${score === total ? "OK" : "FAILED"}: ${score}/${total} đạt`);
process.exit(score === total ? 0 : 1);
