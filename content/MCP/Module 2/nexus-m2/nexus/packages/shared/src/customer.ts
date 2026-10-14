import { z } from "zod";

export const CITIES = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ"] as const;
export type City = (typeof CITIES)[number];

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  city: z.enum(CITIES),
  tier: z.enum(["free", "pro", "enterprise"]),
  createdAt: z.iso.datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

/** Trần cứng cho mọi tool trả danh sách: LLM không được kéo cả collection vào context. */
export const MAX_LIST_LIMIT = 50;

export const ListCustomersInputSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .describe("Lọc theo thành phố, ví dụ 'Hà Nội'. Không phân biệt hoa thường và dấu."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(20)
    .describe(`Số bản ghi tối đa trả về (1–${MAX_LIST_LIMIT}). 'total' luôn là tổng thật.`),
});
export type ListCustomersInput = z.infer<typeof ListCustomersInputSchema>;

/**
 * Khóa so khớp thành phố: bỏ dấu, bỏ hoa thường, gộp khoảng trắng.
 * "Hà Nội" / "ha noi" / "HA  NỘI" → "ha noi". Lưu sẵn vào DB (cityKey) để query dùng được index.
 */
export function cityKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
