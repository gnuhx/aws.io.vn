import { z } from "zod";

export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export const CitySchema = z.enum(CITIES);
export type City = z.infer<typeof CitySchema>;

export const TIERS = ["free", "pro", "enterprise"] as const;
export const TierSchema = z.enum(TIERS).describe("Gói dịch vụ: free, pro hoặc enterprise");
export type Tier = z.infer<typeof TierSchema>;

// Id khách hàng: parse một lần ở ranh giới (SDK parse arguments), mang nhãn type CustomerId.
export const CUSTOMER_ID_RE = /^cus_\d{3,}$/;
export const CustomerIdSchema = z
  .string()
  .regex(CUSTOMER_ID_RE, "Id khách hàng có dạng 'cus_' + số, ví dụ 'cus_007'")
  .brand<"CustomerId">()
  .describe("Id khách hàng, ví dụ 'cus_007'");
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: CitySchema,
  tier: TierSchema,
  email: z.string(),
  createdAt: z.string().describe("Ngày tạo, ISO 8601"),
});
export type Customer = z.infer<typeof CustomerSchema>;

// ---------- input ----------
export const ListCustomersInputSchema = z.object({
  city: CitySchema.optional().describe("Lọc theo thành phố; bỏ trống = mọi thành phố"),
  limit: z.number().int().min(1).max(50).default(20).describe("Số bản ghi tối đa trả về trong 'items' (1–50)"),
});

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });

export const UpdateCustomerTierInputSchema = z.object({ id: CustomerIdSchema, tier: TierSchema });

export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });

// M4 · S4.5 — tìm theo tên/email, trả resource_link thay vì nội dung đầy đủ
export const SearchCustomersInputSchema = z.object({
  query: z.string().trim().min(2).max(100).describe("Chuỗi cần tìm trong tên hoặc email; không phân biệt hoa thường và dấu"),
  city: CitySchema.optional().describe("Lọc thêm theo thành phố"),
  limit: z.number().int().min(1).max(100).default(20).describe("Số kết quả tối đa (1–100)"),
});

// ---------- output ----------
const CustomerSummarySchema = CustomerSchema.pick({ id: true, name: true, city: true, tier: true });

export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng field này để đếm"),
  returned: z.number().int(),
  items: z.array(CustomerSummarySchema),
});

export const GetCustomerOutputSchema = CustomerSchema;

export const UpdateCustomerTierOutputSchema = z.object({
  id: z.string(),
  tier: TierSchema,
  previousTier: TierSchema,
  changed: z.boolean(),
});

export const DeleteCustomerOutputSchema = z.object({ id: z.string(), deleted: z.boolean() });

export const SearchCustomersOutputSchema = z.object({
  query: z.string(),
  total: z.number().int().describe("Tổng số khách khớp — có thể lớn hơn số link trả về"),
  returned: z.number().int(),
  items: z.array(z.object({ id: z.string(), name: z.string(), uri: z.string() })),
});
