import type { City, Customer, CustomerId, Tier } from "@nexus/shared";

export interface CustomerPage {
  total: number;
  items: Customer[];
}

export interface TierChange {
  previousTier: Tier;
  changed: boolean;
}

/**
 * Sự kiện thay đổi dữ liệu (M4 · S4.3). Tách 2 loại vì MCP tách 2 thông báo:
 *   updated         → nội dung 1 resource đổi       → notifications/resources/updated (cho ai subscribe)
 *   created/deleted → danh sách resource đổi         → notifications/resources/list_changed
 */
export type CustomerChange =
  | { kind: "updated"; id: string }
  | { kind: "created"; id: string }
  | { kind: "deleted"; id: string };

export type Unwatch = () => void;

/**
 * Hợp đồng dữ liệu khách hàng. 2 implementation: Mongo (production) và RAM (dev/test, sandbox dựng bài).
 * Tool và resource chỉ biết interface này.
 */
export interface CustomerRepository {
  list(filter: { city?: City | undefined; limit: number }): Promise<CustomerPage>;
  /** Nhận CustomerId đã parse (branded) — string thô là lỗi compile. */
  get(id: CustomerId): Promise<Customer | undefined>;
  countByCity(): Promise<Record<City, number>>;
  /** undefined = không có khách này. */
  updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined>;
  /** false = không có gì để xóa (gọi lần 2). */
  delete(id: CustomerId): Promise<boolean>;
  /** M4 · S4.5 — tìm theo tên/email (không phân biệt hoa thường, bỏ dấu). */
  search(filter: { query: string; city?: City | undefined; limit: number }): Promise<CustomerPage>;
  /** M4 · S4.3 — nghe thay đổi (kể cả từ process khác, với Mongo change stream). Trả hàm hủy. */
  watch(listener: (change: CustomerChange) => void): Unwatch;
}

/** Chuẩn hóa để tìm kiếm: thường hóa + bỏ dấu tiếng Việt ("Cà phê" → "ca phe"). */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase();
}
