import { z } from "zod";

/** Thành phố có trong dữ liệu Nexus (dùng z.enum thay cho enum TS). */
export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const TIERS = ["free", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

/** Id khách hàng: "cus_" + ít nhất 3 chữ số. Sai định dạng → schema chặn, handler không chạy. */
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng dạng 'cus_007' — lấy từ kết quả nexus_list_customers.");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(TIERS),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe(
      `Tên thành phố, có dấu hoặc không. Giá trị có dữ liệu: ${CITIES.join(", ")} ` +
        "(Sài Gòn / Hồ Chí Minh → dùng 'TP.HCM'). Bỏ trống = mọi thành phố.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trong 'items' (1–${MAX_LIST_LIMIT}). Không ảnh hưởng 'total'.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

export const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });
export type CustomerSummary = z.infer<typeof CustomerSummarySchema>;

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int().describe("Số phần tử trong items (≤ limit)"),
  items: z.array(CustomerSummarySchema),
});
export type ListCustomersOutput = z.infer<typeof ListCustomersOutputSchema>;

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierInputSchema = z.object({
  id: CustomerIdSchema,
  tier: z.enum(TIERS).describe("Gói mới: free | pro | enterprise"),
});
export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  previousTier: z.enum(TIERS),
  tier: z.enum(TIERS),
  changed: z.boolean().describe("false nếu gói đã đúng từ trước (gọi lại không đổi gì)"),
});

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({
  id: z.string(),
  deleted: z.boolean().describe("false nếu khách không tồn tại (đã xóa trước đó) — gọi lại an toàn"),
});

/**
 * Khóa so khớp thành phố: bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng, bỏ dấu chấm, chữ thường.
 * "HÀ  NỘI" → "ha noi" · "Đà Nẵng" → "da nang" · "TP.HCM" → "tp hcm"
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[.]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
