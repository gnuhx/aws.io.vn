import type { City, Customer, CustomerId, Industry, Tier } from "@nexus/shared";

export interface CustomerFilter {
  city?: City | undefined;
  tier?: Tier | undefined;
}
export type CustomerPatch = Partial<{ city: City; industry: Industry }>;

/** Lấy tối đa bao nhiêu gợi ý cho completion: trần của spec (100) + 1 → SDK cắt còn 100 và báo hasMore=true (S6.3). */
export const COMPLETION_FETCH = 101;

/** Hợp đồng repository — bản RAM (M2–M6) và bản Mongo (M10) cùng hình dạng. */
export interface CustomerRepository {
  list(filter: CustomerFilter, limit: number): Promise<{ total: number; items: Customer[] }>;
  get(id: CustomerId): Promise<Customer | undefined>;
  update(id: CustomerId, patch: CustomerPatch): Promise<Customer | undefined>;
  /** Gợi ý khi gõ (completion, S6.3): id bắt đầu bằng q, rồi tên bắt đầu bằng q, rồi tên chứa q — không phân biệt dấu. */
  search(q: string, filter: CustomerFilter, limit: number): Promise<Customer[]>;
}
