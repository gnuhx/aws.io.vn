import { z } from "zod";

export const PRODUCTS = ["Gói Pro", "Gói Enterprise", "Tư vấn", "Đào tạo", "Tích hợp API"] as const;
export const ProductSchema = z.enum(PRODUCTS);
export const ORDER_STATUSES = ["paid", "pending", "refunded"] as const;

export const OrderSchema = z.object({
  id: z.string().regex(/^ord_\d{5}$/).describe("Mã đơn, dạng ord_00042"),
  customerId: z.string().describe("Id khách (cus_007) — nối với customers.id"),
  product: ProductSchema.describe(`Sản phẩm: ${PRODUCTS.join(", ")}`),
  amount: z.number().int().positive().describe("Số tiền VND, số nguyên"),
  status: z.enum(ORDER_STATUSES).describe("paid = đã thu (tính doanh thu) · pending · refunded"),
  city: z.string().describe("Thành phố của khách lúc đặt (khu vực)"),
  createdAt: z.iso.datetime().describe("Thời điểm đặt, ISO 8601 UTC"),
});
export type Order = z.infer<typeof OrderSchema>;
