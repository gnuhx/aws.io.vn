import { z } from "zod";

/** Mã tiền tệ ISO 4217: đúng 3 chữ cái in hoa. Chữ thường được nâng lên trước khi kiểm. */
export const CurrencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Mã tiền tệ phải là 3 chữ cái ISO 4217, ví dụ USD, VND, EUR")
  .describe("Mã tiền tệ ISO 4217 (3 chữ cái), ví dụ 'USD', 'VND', 'EUR'.");

export const ExchangeRateInputSchema = z.object({
  base: CurrencySchema.describe("Tiền gốc, ví dụ 'USD'."),
  quote: CurrencySchema.default("VND").describe("Tiền quy đổi sang, mặc định 'VND'."),
});

export const ExchangeRateOutputSchema = z.object({
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive().describe("1 base = rate quote"),
  asOf: z.string().describe("Thời điểm nguồn cập nhật tỷ giá (UTC)"),
  source: z.string(),
});
export type ExchangeRate = z.infer<typeof ExchangeRateOutputSchema>;
