import { z } from "zod";

export const CITIES = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ"] as const;
export const TIERS = ["free", "pro", "enterprise"] as const;
export const INDUSTRIES = ["cafe", "retail", "logistics", "education", "software", "manufacturing"] as const;

export const CitySchema = z.enum(CITIES);
export const TierSchema = z.enum(TIERS);
export const IndustrySchema = z.enum(INDUSTRIES);
export type City = z.infer<typeof CitySchema>;
export type Tier = z.infer<typeof TierSchema>;
export type Industry = z.infer<typeof IndustrySchema>;

export const CustomerIdSchema = z
  .string()
  .regex(/^cus_\d{3,}$/, { error: "id khách có dạng cus_ + ít nhất 3 chữ số, ví dụ cus_007" })
  .brand<"CustomerId">();
export type CustomerId = z.infer<typeof CustomerIdSchema>;

/** Khách nhập từ file cũ (S6.2) có thể thiếu `city` / `industry` — chỉ còn `address` và `note` dạng chữ tự do. */
export const CustomerSchema = z.object({
  id: CustomerIdSchema,
  name: z.string(),
  city: CitySchema.nullable(),
  tier: TierSchema,
  email: z.email(),
  industry: IndustrySchema.nullable(),
  address: z.string(),
  note: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const ListCustomersInputSchema = z.object({
  city: CitySchema.optional().describe(`Lọc theo thành phố: ${CITIES.join(", ")}`),
  tier: TierSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20).describe("Tối đa 50"),
});
export const ListCustomersOutputSchema = z.object({
  total: z.number().int(),
  items: z.array(CustomerSchema.pick({ id: true, name: true, city: true, tier: true, industry: true })),
});

export const GetCustomerInputSchema = z.object({ id: CustomerIdSchema });
export const GetCustomerOutputSchema = CustomerSchema;
