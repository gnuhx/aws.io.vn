import type { Order } from "@nexus/shared";

export type Dimension = "month" | "city" | "product";
export interface MonthRange {
  from?: string | undefined;
  to?: string | undefined;
}
export interface RevenueRow {
  key: string;
  orders: number;
  revenue: number;
}
export interface OrderFilter extends MonthRange {
  customerId?: string | undefined;
  product?: string | undefined;
  city?: string | undefined;
  status?: Order["status"] | undefined;
  minAmount?: number | undefined;
}

/** Đơn hàng (M5 · S5.2). S5.4: tổng hợp NGAY TRONG nguồn dữ liệu — tool không bao giờ kéo hết đơn về rồi tự cộng. */
export interface OrderRepository {
  /** Toàn bộ đơn — chỉ dùng cho store RAM và seed; tool không bao giờ trả thẳng kết quả này. */
  all(): Promise<readonly Order[]>;
  /** Doanh thu = đơn status "paid"; tháng tính theo giờ Việt Nam (glossary). */
  revenueBy(by: Dimension, range: MonthRange): Promise<RevenueRow[]>;
  find(filter: OrderFilter, sample: number): Promise<{ matched: number; totalAmount: number; sample: Order[] }>;
}

/** "2026-08-31T20:00:00Z" → "2026-09": tháng theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
export const vnMonth = (iso: string): string => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 7);

const inRange = (m: string, r: MonthRange): boolean => (r.from === undefined || m >= r.from) && (r.to === undefined || m <= r.to);

export function createMemoryOrderRepository(seed: readonly Order[]): OrderRepository {
  const rows: readonly Order[] = seed.map((o) => Object.freeze({ ...o }));
  return {
    async all() {
      return rows;
    },
    async revenueBy(by, range) {
      const groups = new Map<string, RevenueRow>();
      for (const o of rows) {
        const m = vnMonth(o.createdAt);
        if (o.status !== "paid" || !inRange(m, range)) continue;
        const key = by === "month" ? m : by === "city" ? o.city : o.product;
        const g = groups.get(key) ?? { key, orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += o.amount;
        groups.set(key, g);
      }
      return [...groups.values()];
    },
    async find(f, sample) {
      const hit = rows.filter(
        (o) =>
          (f.customerId === undefined || o.customerId === f.customerId) &&
          (f.product === undefined || o.product === f.product) &&
          (f.city === undefined || o.city === f.city) &&
          (f.status === undefined || o.status === f.status) &&
          (f.minAmount === undefined || o.amount >= f.minAmount) &&
          inRange(vnMonth(o.createdAt), f),
      );
      const newest = [...hit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, sample);
      return { matched: hit.length, totalAmount: hit.reduce((s, o) => s + o.amount, 0), sample: newest };
    },
  };
}
