/**
 * Kiểm mini agent với server Nexus thật (stdio) — chạy được không cần API key.
 *   node scripts/agent-check.ts
 */
import { runAgent, type AgentEvent } from "../src/agent/loop.ts";
import { connect, NEXUS_SERVER, type Session } from "../src/connect.ts";
import { providerFromFlag } from "../src/llm/index.ts";

let failed = 0;
const check = (ok: boolean, label: string): void => {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failed++;
};
const s: Session = await connect(NEXUS_SERVER, { name: "agent-check" });
const ask = (llm: string, question: string, maxSteps: number, events: AgentEvent[] = []) =>
  runAgent({ llm: providerFromFlag(llm, {}), mcp: s.client, question, maxSteps, onEvent: (e) => void events.push(e) });

// 1. câu hỏi nhiều bước: đáp án phải khớp số tính độc lập bằng chính các tool
const r1 = await ask("scripted:hanoi-top", "Khách Hà Nội nào mua nhiều nhất quý 3/2026?", 8);
const hn = (await s.client.callTool({ name: "nexus_list_customers", arguments: { city: "Hà Nội", limit: 50 } })).structuredContent as { items: { id: string }[] };
const totals = await Promise.all(
  hn.items.map(async (c) => {
    const r = await s.client.callTool({ name: "nexus_find_orders", arguments: { customerId: c.id, status: "paid", from: "2026-07", to: "2026-09", sample: 0 } });
    return { id: c.id, total: (r.structuredContent as { totalAmount: number }).totalAmount };
  }),
);
const best = totals.sort((a, b) => b.total - a.total)[0];
check(r1.status === "answered" && best !== undefined && r1.text.includes(`(${best.id})`), `câu hỏi nhiều bước → ${r1.status}, ${r1.steps} lượt LLM, ${r1.toolCalls} tool call, đáp án chứa ${best?.id}`);

// 2. model không chịu dừng → agent dừng đúng ở maxSteps
const r2 = await ask("scripted:list-all", "Liệt kê hết việc của Lan", 6);
check(r2.status === "max_steps" && r2.steps === 6 && r2.toolCalls === 6, `model lặp mãi → ${r2.status} sau ${r2.steps} lượt, ${r2.toolCalls} tool call`);

// 3. tool phá hủy bị host giấu: model gọi bằng tên → isError, dữ liệu không đổi
const ev: AgentEvent[] = [];
const r3 = await ask("scripted:delete-attempt", "Xóa việc task_0002", 4, ev);
const del = ev.find((e) => e.type === "tool" && e.name === "nexus_delete_task");
const still = (await s.client.callTool({ name: "nexus_list_tasks", arguments: { assignee: "trang", limit: 5 } })).structuredContent as { items: { id: string }[] };
check(r3.status === "answered" && del?.type === "tool" && del.isError && still.items.some((t) => t.id === "task_0002"), "tool có destructiveHint không đưa cho model → gọi bừa bị chặn, task_0002 còn nguyên");

// 4. LLM lỗi cấu hình → dừng gọn, không ném, phiên MCP vẫn dùng được
const r4 = await ask("anthropic", "Doanh thu tháng 9?", 4);
const ping = await s.client.callTool({ name: "nexus_ping" });
check(r4.status === "llm_error" && r4.error.kind === "config" && !ping.isError, `thiếu API key → ${r4.status} (${r4.status === "llm_error" ? r4.error.message : ""}), MCP vẫn sống`);

await s.close();
console.log(failed ? `FAILED: ${failed}` : "OK: agent 4/4");
process.exit(failed ? 1 : 0);
