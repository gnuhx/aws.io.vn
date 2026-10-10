import { PRODUCTS, type Customer, type Order } from "@nexus/shared";

/** LCG cố định: cùng seed → cùng dữ liệu ở mọi máy (để số liệu trong bài chạy lại ra y nguyên). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const PRICE: Record<(typeof PRODUCTS)[number], readonly [number, number]> = {
  "Gói Pro": [2_400_000, 6_000_000],
  "Gói Enterprise": [15_000_000, 40_000_000],
  "Tư vấn": [5_000_000, 20_000_000],
  "Đào tạo": [8_000_000, 25_000_000],
  "Tích hợp API": [10_000_000, 50_000_000],
};

/** n đơn hàng rải đều 12 tháng 2025-10 → 2026-09, giờ UTC. */
export function seedOrders(customers: readonly Customer[], n = 600, seed = 2026): Order[] {
  const r = rng(seed);
  const start = Date.UTC(2025, 9, 1);
  const end = Date.UTC(2026, 9, 1);
  const out: Order[] = [];
  for (let i = 0; i < n; i++) {
    const c = customers[Math.floor(r() * customers.length)];
    if (!c) continue;
    const product = PRODUCTS[Math.floor(r() * PRODUCTS.length)] ?? "Gói Pro";
    const [lo, hi] = PRICE[product];
    const amount = Math.round((lo + r() * (hi - lo)) / 100_000) * 100_000;
    const p = r();
    out.push({
      id: `ord_${String(i + 1).padStart(5, "0")}`,
      customerId: c.id,
      product,
      amount,
      status: p < 0.88 ? "paid" : p < 0.96 ? "pending" : "refunded",
      city: c.city,
      createdAt: new Date(start + Math.floor(r() * (end - start))).toISOString(),
    });
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
