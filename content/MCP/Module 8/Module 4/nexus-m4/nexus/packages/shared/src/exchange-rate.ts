import { z } from "zod";

export const CurrencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Mã tiền tệ ISO 4217 gồm 3 chữ cái, ví dụ 'USD', 'VND'")
  .describe("Mã tiền tệ ISO 4217, ví dụ 'USD'");

export const ExchangeRateInputSchema = z.object({
  base: CurrencySchema,
  quote: CurrencySchema.default("VND"),
});

export const ExchangeRateOutputSchema = z.object({
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive(),
  asOf: z.string().describe("Thời điểm nguồn cập nhật, ISO 8601"),
  source: z.string(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateOutputSchema>;
