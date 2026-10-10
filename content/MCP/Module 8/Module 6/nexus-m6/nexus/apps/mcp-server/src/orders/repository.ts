import type { City, CustomerId, Order, RevenueRow } from "@nexus/shared";

export type RevenueBy = "month" | "city" | "product";
export interface MonthRange {
  from?: string | undefined;
  to?: string | undefined;
}
export interface OrderFilter extends MonthRange {
  customerId?: CustomerId | undefined;
  product?: Order["product"] | undefined;
  status?: Order["status"] | undefined;
}

/** Hợp đồng nói CÂU HỎI (doanh thu theo…), không nói BẢNG (getOrders) — M5 · S5.4. */
export interface OrderRepository {
  revenueBy(by: RevenueBy, range: MonthRange): Promise<RevenueRow[]>;
  find(filter: OrderFilter, sample: number): Promise<{ matched: number; totalAmount: number; sample: Order[] }>;
}

/** Tháng theo giờ Việt Nam (+7, không đổi giờ mùa hè). */
export const vnMonth = (iso: string): string => new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 7);

const inRange = (m: string, r: MonthRange): boolean => (!r.from || m >= r.from) && (!r.to || m <= r.to);

export function createMemoryOrders(seed: readonly Order[], cityOf: (id: CustomerId) => City | null): OrderRepository {
  const rows = [...seed];
  return {
    async revenueBy(by, range) {
      const groups = new Map<string, { orders: number; revenue: number }>();
      let total = 0;
      for (const o of rows) {
        if (o.status !== "paid" || !inRange(vnMonth(o.createdAt), range)) continue;
        const key = by === "month" ? vnMonth(o.createdAt) : by === "city" ? (cityOf(o.customerId) ?? "(chưa rõ)") : o.product;
        const g = groups.get(key) ?? { orders: 0, revenue: 0 };
        g.orders += 1;
        g.revenue += o.amount;
        groups.set(key, g);
        total += o.amount;
      }
      const out = [...groups].map(([key, g]) => ({ key, ...g, share: total ? Math.round((g.revenue / total) * 1000) / 1000 : 0 }));
      return by === "month" ? out.sort((a, b) => a.key.localeCompare(b.key)) : out.sort((a, b) => b.revenue - a.revenue);
    },
    async find(f, sample) {
      const hit = rows.filter(
        (o) =>
          (!f.customerId || o.customerId === f.customerId) &&
          (!f.product || o.product === f.product) &&
          (!f.status || o.status === f.status) &&
          inRange(vnMonth(o.createdAt), f),
      );
      return {
        matched: hit.length,
        totalAmount: hit.reduce((s, o) => s + o.amount, 0),
        sample: hit.slice(-sample).reverse(),
      };
    },
  };
}
