import { z } from "zod";
import { CitySchema, CustomerIdSchema, IndustrySchema } from "./customer.ts";

export const ENRICH_FIELDS = ["city", "industry"] as const;
export type EnrichField = (typeof ENRICH_FIELDS)[number];

export const EnrichCustomerInputSchema = z.object({
  id: CustomerIdSchema,
  apply: z.boolean().default(false).describe("true = ghi đề xuất vào hồ sơ (chỉ field đang trống). Mặc định chỉ đề xuất."),
});

/** Đề xuất luôn nằm trong tập giá trị hợp lệ — LLM trả gì khác cũng bị loại trước khi tới đây. */
export const EnrichSuggestionSchema = z.object({
  city: CitySchema.nullable(),
  industry: IndustrySchema.nullable(),
});
export type EnrichSuggestion = z.infer<typeof EnrichSuggestionSchema>;

export const EnrichCustomerOutputSchema = z.object({
  id: CustomerIdSchema,
  source: z.enum(["sampling", "rules", "none"]).describe("sampling = LLM của client (người dùng đã duyệt); rules = luật tại server"),
  model: z.string().optional(),
  missing: z.array(z.enum(ENRICH_FIELDS)),
  suggestion: EnrichSuggestionSchema,
  applied: z.array(z.enum(ENRICH_FIELDS)),
  note: z.string(),
});
export type EnrichCustomerOutput = z.infer<typeof EnrichCustomerOutputSchema>;
