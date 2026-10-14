import { CustomerSchema, OrderSchema, TaskSchema, type QueryCollection } from "@nexus/shared";
import { z } from "zod";

/**
 * 1 nguồn sự thật cho: field nào truy vấn được (guard) + tài liệu schema cho LLM (resource nexus://schema).
 * Sinh từ chính Zod schema của dữ liệu — đổi schema là tài liệu đổi theo, không ai phải nhớ sửa tay.
 */
const SCHEMAS = { customers: CustomerSchema, orders: OrderSchema, tasks: TaskSchema } as const satisfies Record<QueryCollection, z.ZodObject>;

const NOTES: Partial<Record<QueryCollection, Record<string, string>>> = {
  customers: {
    id: "Id khách, dạng cus_007",
    name: "Tên tổ chức (có dấu)",
    email: "Email liên hệ",
    city: "Thành phố",
    tier: "Gói dịch vụ",
    createdAt: "Ngày bắt đầu dùng, ISO 8601 UTC",
  },
  tasks: {
    id: "Id việc, dạng task_0042",
    title: "Tiêu đề",
    status: "todo | doing | done",
    assignee: "Tên đăng nhập người phụ trách",
    customerId: "Khách liên quan (có thể null)",
    dueDate: "Hạn YYYY-MM-DD (có thể null)",
    createdAt: "Lúc tạo, ISO 8601 UTC",
    updatedAt: "Lúc sửa gần nhất",
  },
};

const EXAMPLES: Record<QueryCollection, string[]> = {
  customers: ['{"city":"Hà Nội","tier":"pro"}', '{"tier":{"$in":["pro","enterprise"]}}'],
  orders: ['{"status":"paid","amount":{"$gte":20000000}}', '{"customerId":"cus_007","createdAt":{"$gte":"2026-07-01"}}'],
  tasks: ['{"assignee":"lan","status":{"$ne":"done"}}', '{"dueDate":{"$lt":"2026-08-01"},"status":"todo"}'],
};

export const ALLOWED_FIELD_OPS = ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$not"] as const;
export const ALLOWED_LOGICAL_OPS = ["$and", "$or", "$nor"] as const;
export const LIMITS = { depth: 4, nodes: 40, inSize: 50, regexLength: 64 } as const;

interface FieldDoc {
  name: string;
  type: string;
  note: string;
}

function describeFields(c: QueryCollection): FieldDoc[] {
  const js = z.toJSONSchema(SCHEMAS[c]) as { properties?: Record<string, { type?: string; enum?: unknown[]; format?: string; description?: string }> };
  return Object.entries(js.properties ?? {}).map(([name, p]) => ({
    name,
    type: p.enum ? p.enum.map((v) => JSON.stringify(v)).join(", ") : p.format ? `${p.type} (${p.format})` : (p.type ?? "?"),
    note: p.description ?? NOTES[c]?.[name] ?? "",
  }));
}

export const FIELDS: Record<QueryCollection, ReadonlySet<string>> = {
  customers: new Set(describeFields("customers").map((f) => f.name)),
  orders: new Set(describeFields("orders").map((f) => f.name)),
  tasks: new Set(describeFields("tasks").map((f) => f.name)),
};

function render(): string {
  const parts = [
    "# Schema dữ liệu Nexus",
    "",
    "Đọc trước khi gọi `nexus_query`. Chỉ đọc; tool không ghi được gì. Field không có trong bảng → lỗi.",
  ];
  for (const c of Object.keys(SCHEMAS) as QueryCollection[]) {
    parts.push("", `## ${c}`, "", "| field | kiểu | ghi chú |", "|---|---|---|");
    for (const f of describeFields(c)) parts.push(`| \`${f.name}\` | ${f.type} | ${f.note} |`);
    parts.push("", `Ví dụ filter: ${EXAMPLES[c].map((e) => `\`${e}\``).join(" · ")}`);
  }
  parts.push(
    "",
    "## Toán tử",
    "",
    `Cho phép trên field: ${ALLOWED_FIELD_OPS.map((o) => `\`${o}\``).join(" ")}. Ghép điều kiện: ${ALLOWED_LOGICAL_OPS.map((o) => `\`${o}\``).join(" ")}.`,
    "Mọi toán tử khác bị từ chối — gồm `$where`, `$function`, `$accumulator`, `$expr` (chạy mã / biểu thức trên server DB).",
    `Giới hạn: sâu ≤ ${LIMITS.depth} tầng · ≤ ${LIMITS.nodes} điều kiện · \`$in\` ≤ ${LIMITS.inSize} giá trị · \`$regex\` ≤ ${LIMITS.regexLength} ký tự · limit ≤ 50.`,
    "Ngày là chuỗi ISO 8601 so sánh theo thứ tự chuỗi: `\"2026-07-01\"` ≤ mọi thời điểm trong tháng 7/2026.",
    "Đếm: dùng `matched` trong kết quả, không đếm `items`. Tổng doanh thu theo nhóm: dùng `nexus_revenue_by`, đừng tự cộng.",
  );
  return `${parts.join("\n")}\n`;
}

/** Sinh 1 lần lúc import (schema không đổi khi server đang chạy). */
export const SCHEMA_DOC = render();
