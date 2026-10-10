import { z } from "zod";

/** Collection mà tool truy vấn được — whitelist, không phải mọi collection trong DB (M5 · S5.2). */
export const QUERY_COLLECTIONS = ["customers", "orders", "tasks"] as const;
export type QueryCollection = (typeof QUERY_COLLECTIONS)[number];

export const QueryInputSchema = z.object({
  collection: z.enum(QUERY_COLLECTIONS).describe(`Collection: ${QUERY_COLLECTIONS.join(", ")} — field xem ở resource nexus://schema`),
  filter: z
    .record(z.string(), z.unknown())
    .default({})
    .describe('Filter kiểu MongoDB, chỉ toán tử đọc: {"city":"Hà Nội","amount":{"$gte":5000000}}'),
  fields: z.array(z.string()).max(8).optional().describe("Chỉ lấy các field này (mặc định: mọi field)"),
  sort: z.object({ field: z.string(), order: z.enum(["asc", "desc"]) }).optional(),
  limit: z.number().int().min(1).max(50).default(20).describe("Số bản ghi tối đa (1–50)"),
});

export const QueryOutputSchema = z.object({
  collection: z.enum(QUERY_COLLECTIONS),
  matched: z.number().int().describe("Tổng số bản ghi khớp — dùng để đếm"),
  returned: z.number().int(),
  items: z.array(z.record(z.string(), z.unknown())),
});
