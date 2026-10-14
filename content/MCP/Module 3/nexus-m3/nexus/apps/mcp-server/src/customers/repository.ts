import type { Customer, CustomerId, Tier } from "@nexus/shared";

export interface CustomerQuery {
  city?: string | undefined;
  limit: number;
}

export interface CustomerPage {
  /** Tổng số bản ghi khớp filter (không bị limit cắt). */
  total: number;
  items: Customer[];
}

export interface TierChange {
  previousTier: Tier;
  tier: Tier;
  changed: boolean;
}

/** Hợp đồng hẹp theo use case — tool không biết Mongo hay RAM ở phía sau. */
export interface CustomerRepository {
  list(q: CustomerQuery): Promise<CustomerPage>;
  /** undefined = không tồn tại (lỗi nghiệp vụ, không phải exception). */
  get(id: CustomerId): Promise<Customer | undefined>;
  /** undefined = không tồn tại. Idempotent: đặt lại cùng gói → changed=false. */
  updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined>;
  /** true = đã xóa, false = không có gì để xóa. Idempotent. */
  delete(id: CustomerId): Promise<boolean>;
}
