import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const PRODUCTS = ["Hạt rang mộc", "Cà phê phin", "Cold brew", "Máy pha", "Khóa đào tạo"] as const;
export const ORDER_STATUSES = ["paid", "pending", "refunded"] as const;

export const OrderSchema = z.object({
  id: z.string().regex(/^ord_\d{4,}$/),
  customerId: CustomerIdSchema,
  product: z.enum(PRODUCTS),
  amount: z.number().int().nonnegative().describe("VND"),
  status: z.enum(ORDER_STATUSES),
  createdAt: z.iso.datetime(),
});
export type Order = z.infer<typeof OrderSchema>;
