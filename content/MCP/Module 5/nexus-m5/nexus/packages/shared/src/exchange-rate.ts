import { z } from "zod";

export const CURRENCIES = ["USD", "EUR", "JPY", "SGD"] as const;

export const GetExchangeRateInputSchema = z.object({
  from: z.enum(CURRENCIES).describe(`Mã tiền tệ nguồn: ${CURRENCIES.join(", ")}`),
});
export const GetExchangeRateOutputSchema = z.object({
  from: z.enum(CURRENCIES),
  to: z.literal("VND"),
  rate: z.number().positive(),
  asOf: z.string(),
});
