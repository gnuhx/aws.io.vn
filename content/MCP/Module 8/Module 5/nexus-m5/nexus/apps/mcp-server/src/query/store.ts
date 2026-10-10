import type { QueryCollection } from "@nexus/shared";

export type Row = Readonly<Record<string, unknown>>;

export interface FindOptions {
  fields?: readonly string[] | undefined;
  sort?: { field: string; order: "asc" | "desc" } | undefined;
  limit: number;
}

/**
 * Cửa truy vấn của tool nexus_query — CHỈ có đọc (M5 · S5.2).
 * Không có insert/update/delete trên kiểu: code tool không gọi được hàm ghi, kể cả do nhầm.
 * Bản Mongo còn đi qua user DB chỉ có role "read": DB từ chối ghi dù code có lỗ.
 */
export interface ReadOnlyStore {
  find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions): Promise<{ matched: number; items: Row[] }>;
}
