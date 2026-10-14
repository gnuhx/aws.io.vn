import { z } from "zod";
import { CitySchema } from "./customer.ts";

/**
 * Đường dẫn tương đối trong thư mục export (M5 · S5.1) — lớp chặn thứ 1 (hình thức).
 * Mỗi đoạn bắt đầu bằng chữ/số → không có "..", ".", đoạn rỗng, "/" đầu, "\", "%", NUL.
 * Lớp 2–3 (resolve + realpath) vẫn bắt buộc ở server: regex không biết symlink.
 */
const SEGMENT = "[A-Za-z0-9][A-Za-z0-9._-]{0,63}";
export const ExportPathSchema = z
  .string()
  .max(200)
  .regex(new RegExp(`^${SEGMENT}(?:/${SEGMENT}){0,3}$`), "path là đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv")
  .describe("Đường dẫn tương đối trong thư mục export, ví dụ 2026-09/doanh-thu.csv (lấy từ nexus_list_exports)");

export const EXPORT_TEXT_TYPES = { ".csv": "text/csv", ".md": "text/markdown", ".txt": "text/plain", ".json": "application/json" } as const;

export const ListExportsOutputSchema = z.object({
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(z.object({ path: z.string(), bytes: z.number().int(), modified: z.string() })),
});

export const ReadExportInputSchema = z.object({
  path: ExportPathSchema,
  maxBytes: z.number().int().min(256).max(32_000).default(8_000).describe("Đọc tối đa bấy nhiêu byte đầu file (256–32000)"),
});
export const ReadExportOutputSchema = z.object({
  path: z.string(),
  mimeType: z.string(),
  bytes: z.number().int().describe("Kích thước thật của file"),
  truncated: z.boolean(),
  text: z.string(),
});

export const ExportCustomersInputSchema = z.object({
  filename: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,59}\.csv$/, "filename chỉ gồm a-z, 0-9, dấu - và kết thúc .csv, ví dụ khach-ha-noi.csv")
    .describe("Tên file .csv (không có thư mục), ví dụ khach-ha-noi.csv"),
  city: CitySchema.optional(),
  overwrite: z.boolean().default(false).describe("true = ghi đè nếu file đã có"),
});
export const ExportCustomersOutputSchema = z.object({ path: z.string(), rows: z.number().int(), bytes: z.number().int() });
