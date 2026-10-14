import { z } from "zod";

export const CITIES = ["Hà Nội", "Hải Phòng", "TP.HCM", "Đà Nẵng", "Cần Thơ"] as const;
export const CitySchema = z.enum(CITIES, { error: `city phải là một trong: ${CITIES.join(", ")}` });
export type City = z.infer<typeof CitySchema>;

export const TIERS = ["free", "pro", "enterprise"] as const;
export const TierSchema = z.enum(TIERS);
export type Tier = z.infer<typeof TierSchema>;

/** Id khách đã qua kiểm tra định dạng (branded — M3 · S3.2). */
export const CustomerIdSchema = z
  .string()
  .regex(/^cus_\d{3,}$/, "id khách có dạng cus_ + số, ví dụ cus_007")
  .brand<"CustomerId">();
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: CustomerIdSchema,
  name: z.string(),
  email: z.email(),
  city: CitySchema,
  tier: TierSchema,
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const CustomerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: CitySchema,
  tier: TierSchema,
});

// ---------- nexus_list_customers ----------
export const ListCustomersInputSchema = z.object({
  city: CitySchema.optional().describe(`Lọc theo thành phố: ${CITIES.join(", ")}`),
  limit: z.number().int().min(1).max(50).default(20).describe("Số khách tối đa trả về (1–50)"),
});
export const ListCustomersOutputSchema = z.object({
  total: z.number().int().describe("Tổng số khách khớp bộ lọc — dùng để đếm"),
  returned: z.number().int(),
  items: z.array(CustomerSummarySchema),
});

// ---------- nexus_get_customer ----------
export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema.extend({ id: z.string() });

// ---------- nexus_update_customer_tier ----------
export const UpdateTierInputSchema = z.object({ id: CustomerIdSchema, tier: TierSchema });
export const UpdateTierOutputSchema = z.object({
  id: z.string(),
  previousTier: TierSchema,
  tier: TierSchema,
  changed: z.boolean(),
});

// ---------- nexus_delete_customer ----------
export const DeleteCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const DeleteCustomerOutputSchema = z.object({ id: z.string(), deleted: z.boolean() });

// ---------- nexus_search_customers (M4 · S4.5) ----------
export const SearchCustomersInputSchema = z.object({
  query: z.string().trim().min(2, "query cần ít nhất 2 ký tự").max(60).describe("Một phần tên hoặc email, không cần dấu"),
  limit: z.number().int().min(1).max(100).default(20).describe("Số tham chiếu tối đa (1–100)"),
});
export const SearchCustomersOutputSchema = z.object({
  query: z.string(),
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(z.object({ id: z.string(), name: z.string(), uri: z.string() })),
});
