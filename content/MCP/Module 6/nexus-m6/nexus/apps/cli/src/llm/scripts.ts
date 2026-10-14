import { z } from "zod";
import type { ScriptContext, ScriptStep } from "./scripted.ts";

/**
 * Kịch bản cho provider giả lập. Câu trả lời "của model" ở đây là dữ liệu viết sẵn (fixture) —
 * ghi rõ trong bài. Số liệu trong câu trả lời của agent luôn lấy từ kết quả tool thật.
 */

// --- S6.2: sampling chuẩn hóa khách -------------------------------------------------------
/** Câu trả lời mẫu của 1 LLM cho 5 khách nhập từ file cũ (cus_026–cus_030). */
const ENRICH_ANSWERS: Record<string, { city: string | null; industry: string | null }> = {
  cus_026: { city: "Hà Nội", industry: "cafe" },
  cus_027: { city: "Đà Nẵng", industry: "logistics" },
  cus_028: { city: "TP.HCM", industry: "education" },
  cus_029: { city: "Cần Thơ", industry: "retail" },
  cus_030: { city: "Hà Nội", industry: "software" },
};
const idIn = (text: string): string => /Khách (cus_\d{3})/.exec(text)?.[1] ?? "?";

const enrich: ScriptStep = (ctx) => ({ say: JSON.stringify(ENRICH_ANSWERS[idIn(ctx.lastUserText())] ?? { city: null, industry: null }) });
/** Model hay "lịch sự": câu dẫn + khối ```json — JSON.parse thẳng sẽ chết (Bẫy 2). */
const enrichFenced: ScriptStep = (ctx) => ({
  say: `Dựa trên địa chỉ và ghi chú, đây là đề xuất:\n\`\`\`json\n${JSON.stringify(ENRICH_ANSWERS[idIn(ctx.lastUserText())], null, 2)}\n\`\`\``,
});
/** Model trả giá trị ngoài tập cho phép — phải bị loại, không được ghi vào DB (Bẫy 3). */
const enrichInvalid: ScriptStep = () => ({ say: '{"city": "Hanoi", "industry": "coffee shop"}' });

// --- S6.4: mini agent ---------------------------------------------------------------------
// Chỉ đọc đúng field cần từ kết quả tool (như model đọc JSON) — schema lỏng, không phụ thuộc packages/shared.
const CustomerList = z.object({ items: z.array(z.object({ id: z.string(), name: z.string() })) });
const Found = z.object({ matched: z.number(), totalAmount: z.number() });
const TaskPage = z.object({
  items: z.array(z.object({ id: z.string(), title: z.string(), status: z.string(), dueDate: z.string().nullable() })),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});
const vnd = (n: number): string => `${n.toLocaleString("vi-VN")} ₫`;
const Q3 = { status: "paid", from: "2026-07", to: "2026-09", sample: 0 };

/** Khách Hà Nội × doanh số Q3 (cùng thứ tự gọi) → xếp hạng. */
function ranking(ctx: ScriptContext): { id: string; name: string; total: number; orders: number }[] {
  const customers = ctx.last("nexus_list_customers", CustomerList)?.items ?? [];
  const found = ctx.results("nexus_find_orders", Found);
  return customers
    .map((c, i) => ({ id: c.id, name: c.name, total: found[i]?.totalAmount ?? 0, orders: found[i]?.matched ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

/** "Khách Hà Nội nào mua nhiều nhất Q3/2026, và họ còn việc gì chưa xong?" — 4 lượt LLM, gọi tool song song. */
const hanoiTop: ScriptStep[] = [
  () => ({ call: [{ name: "nexus_list_customers", input: { city: "Hà Nội", limit: 50 } }] }),
  (ctx) => ({
    call: (ctx.last("nexus_list_customers", CustomerList)?.items ?? []).map((c) => ({ name: "nexus_find_orders", input: { customerId: c.id, ...Q3 } })),
  }),
  (ctx) => {
    const top = ranking(ctx)[0];
    if (!top) return { say: "Không có khách nào ở Hà Nội." };
    return {
      call: [
        { name: "nexus_list_tasks", input: { customerId: top.id, status: "todo", limit: 50 } },
        { name: "nexus_list_tasks", input: { customerId: top.id, status: "doing", limit: 50 } },
      ],
    };
  },
  (ctx) => {
    const [top, second, third] = ranking(ctx);
    if (!top) return { say: "Không có khách nào ở Hà Nội." };
    const open = ctx.results("nexus_list_tasks", TaskPage)
      .flatMap((p) => p.items)
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id.localeCompare(b.id));
    // trả lời người đọc: 5 việc hạn gần nhất + số còn lại, không đổ cả danh sách
    const lines = open.slice(0, 5).map((t) => `- ${t.id} · ${t.title} · ${t.status} · hạn ${t.dueDate ?? "—"}`);
    if (open.length > 5) lines.push(`- … và ${open.length - 5} việc nữa`);
    return {
      say: [
        `Khách Hà Nội mua nhiều nhất quý 3/2026 (07–09, đơn đã thanh toán): ${top.name} (${top.id}) — ${vnd(top.total)}, ${top.orders} đơn.`,
        `Xếp sau: ${[second, third].flatMap((x) => (x ? [`${x.name} (${vnd(x.total)})`] : [])).join(", ")}.`,
        `Việc chưa xong với ${top.name}: ${open.length} (5 việc hạn gần nhất):`,
        ...lines,
      ].join("\n"),
    };
  },
];

/** Model "cần mẫn": muốn đọc HẾT việc của Lan, 5 việc/trang — 40 trang. Không có maxSteps thì chạy tới khi hết tiền. */
const listAll: ScriptStep = (ctx) => {
  const pages = ctx.req.messages.filter((m) => m.role === "user").length - 1;
  const last = ctx.last("nexus_list_tasks", TaskPage);
  if (last && !last.nextCursor) return { say: `Đã đọc hết: ${pages} trang.` };
  return { call: [{ name: "nexus_list_tasks", input: { assignee: "lan", limit: 5, ...(last?.nextCursor ? { cursor: last.nextCursor } : {}) } }] };
};

/** Model xin gọi tool phá hủy mà host đã giấu — host trả lỗi, model phải tự xoay. */
const deleteAttempt: ScriptStep[] = [
  () => ({ call: [{ name: "nexus_delete_task", input: { id: "task_0002" } }] }),
  () => ({ say: "Mình không xóa được việc trong phiên này. Bạn có thể đánh dấu xong bằng cập nhật trạng thái." }),
];

export const SCRIPTS: Record<string, { steps: ScriptStep[]; repeatLast?: boolean }> = {
  enrich: { steps: [enrich], repeatLast: true },
  "enrich-fenced": { steps: [enrichFenced], repeatLast: true },
  "enrich-invalid": { steps: [enrichInvalid], repeatLast: true },
  "hanoi-top": { steps: hanoiTop },
  "list-all": { steps: [listAll], repeatLast: true },
  "delete-attempt": { steps: deleteAttempt },
};
