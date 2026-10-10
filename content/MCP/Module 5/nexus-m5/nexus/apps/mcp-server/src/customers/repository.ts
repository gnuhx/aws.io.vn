import type { City, Customer, CustomerId, Tier } from "@nexus/shared";

export interface CustomerPage {
  total: number;
  items: Customer[];
}

export interface TierChange {
  previousTier: Tier;
  changed: boolean;
}

/** Sự kiện thay đổi — union để nơi nhận switch đủ nhánh (M4 · S4.3). */
export type CustomerChange =
  | { kind: "updated"; id: CustomerId }
  | { kind: "created"; id: CustomerId }
  | { kind: "deleted"; id: CustomerId };

/** Hàm hủy đăng ký — giữ hàm này, không giữ tham chiếu listener. */
export type Unwatch = () => void;

export interface CustomerRepository {
  list(q: { city?: City | undefined; limit: number }): Promise<CustomerPage>;
  get(id: CustomerId): Promise<Customer | null>;
  countByCity(): Promise<Record<City, number>>;
  updateTier(id: CustomerId, tier: Tier): Promise<TierChange | null>;
  delete(id: CustomerId): Promise<boolean>;
  search(q: { query: string; limit: number }): Promise<CustomerPage>;
  watch(listener: (change: CustomerChange) => void): Unwatch;
}

/** Bỏ dấu + chữ thường: "Cà phê Đà Nẵng" → "ca phe da nang" (M4 · S4.5). */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
