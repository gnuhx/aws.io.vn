import { z } from "zod";
import { CitySchema, CustomerIdSchema } from "./customer.ts";
import { ExportPathSchema } from "./exports.ts";
import { ORDER_STATUSES, ProductSchema } from "./order.ts";

const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "tháng dạng YYYY-MM, ví dụ 2026-07");

// ---------- nexus_revenue_by (M5 · S5.4): tổng hợp, không trả đơn hàng ----------
export const REVENUE_DIMENSIONS = ["month", "city", "product"] as const;
export const RevenueByInputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS).describe("Nhóm theo: month (giờ Việt Nam) | city | product"),
  from: Month.optional().describe("Từ tháng (gồm), YYYY-MM"),
  to: Month.optional().describe("Tới tháng (gồm), YYYY-MM"),
  top: z.number().int().min(1).max(24).default(24).describe("Giữ N nhóm lớn nhất (month: giữ theo thời gian)"),
});
export const RevenueRowSchema = z.object({
  key: z.string(),
  orders: z.number().int(),
  revenue: z.number().int().describe("VND"),
  share: z.number().describe("Tỉ trọng trên tổng, 0–1, làm tròn 3 chữ số"),
});
export const RevenueByOutputSchema = z.object({
  by: z.enum(REVENUE_DIMENSIONS),
  from: z.string(),
  to: z.string(),
  currency: z.literal("VND"),
  totalRevenue: z.number().int(),
  totalOrders: z.number().int(),
  rows: z.array(RevenueRowSchema),
  omitted: z.number().int().describe("Số nhóm bị bỏ do top (doanh thu của chúng vẫn nằm trong totalRevenue)"),
});

// ---------- nexus_find_orders: lọc + tóm tắt + vài mẫu ----------
export const FindOrdersInputSchema = z.object({
  customerId: CustomerIdSchema.optional(),
  product: ProductSchema.optional(),
  city: CitySchema.optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  minAmount: z.number().int().min(0).optional().describe("VND"),
  from: Month.optional(),
  to: Month.optional(),
  sample: z.number().int().min(0).max(20).default(5).describe("Số đơn mẫu (mới nhất) kèm theo, 0–20"),
});
export const FindOrdersOutputSchema = z.object({
  matched: z.number().int().describe("Tổng số đơn khớp — dùng để đếm"),
  totalAmount: z.number().int().describe("Tổng tiền các đơn khớp (mọi trạng thái đã lọc), VND"),
  sample: z.array(
    z.object({ id: z.string(), customerId: z.string(), product: z.string(), amount: z.number().int(), status: z.string(), createdAt: z.string() }),
  ),
});

// ---------- nexus_analyze_export: phân tích CSV trong thư mục export ----------
export const AnalyzeExportInputSchema = z.object({
  path: ExportPathSchema,
  groupBy: z.string().min(1).max(64).describe("Tên cột để nhóm"),
  sum: z.string().min(1).max(64).optional().describe("Tên cột số để cộng (bỏ trống = chỉ đếm)"),
  where: z.object({ column: z.string(), equals: z.string() }).optional().describe("Chỉ lấy dòng có column == equals"),
  top: z.number().int().min(1).max(30).default(20),
});
export const AnalyzeExportOutputSchema = z.object({
  path: z.string(),
  columns: z.array(z.string()),
  rowCount: z.number().int().describe("Số dòng dữ liệu đã đọc (không tính tiêu đề)"),
  matchedRows: z.number().int(),
  skippedRows: z.number().int().describe("Dòng có cột sum không phải số"),
  groups: z.array(z.object({ key: z.string(), rows: z.number().int(), sum: z.number().optional() })),
  omitted: z.number().int(),
});
