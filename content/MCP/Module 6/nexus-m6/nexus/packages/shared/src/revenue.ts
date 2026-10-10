import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";
import { OrderSchema, ORDER_STATUSES, PRODUCTS } from "./order.ts";

const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "tháng có dạng YYYY-MM" });

export const REVENUE_BY = ["month", "city", "product"] as const;

export const RevenueByInputSchema = z.object({
  by: z.enum(REVENUE_BY).describe("Nhóm theo tháng (giờ VN), thành phố, hoặc sản phẩm"),
  from: Month.optional().describe("Tháng đầu, gồm cả tháng này"),
  to: Month.optional().describe("Tháng cuối, gồm cả tháng này"),
  top: z.number().int().min(1).max(24).default(24),
});
export const RevenueRowSchema = z.object({
  key: z.string(),
  orders: z.number().int(),
  revenue: z.number().int(),
  share: z.number(),
});
export type RevenueRow = z.infer<typeof RevenueRowSchema>;
export const RevenueByOutputSchema = z.object({
  by: z.enum(REVENUE_BY),
  totalRevenue: z.number().int(),
  rows: z.array(RevenueRowSchema),
  omitted: z.number().int(),
});

export const FindOrdersInputSchema = z.object({
  customerId: CustomerIdSchema.optional(),
  product: z.enum(PRODUCTS).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  from: Month.optional(),
  to: Month.optional(),
  sample: z.number().int().min(0).max(20).default(5).describe("Số đơn mẫu mới nhất, tối đa 20"),
});
export const FindOrdersOutputSchema = z.object({
  matched: z.number().int(),
  totalAmount: z.number().int(),
  sample: z.array(OrderSchema),
});
