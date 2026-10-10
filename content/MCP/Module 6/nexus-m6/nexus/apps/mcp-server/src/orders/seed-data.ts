import { OrderSchema, PRODUCTS, type Order } from "@nexus/shared";

/** 600 đơn cố định (LCG — cùng seed là cùng dữ liệu ở mọi máy), 01/10/2025 → 30/09/2026 theo giờ UTC. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const PRICE: Record<(typeof PRODUCTS)[number], number> = {
  "Hạt rang mộc": 1_250_000,
  "Cà phê phin": 850_000,
  "Cold brew": 2_100_000,
  "Máy pha": 18_500_000,
  "Khóa đào tạo": 6_400_000,
};

export function makeOrders(count = 600, seed = 2026): Order[] {
  const rnd = lcg(seed);
  const start = Date.UTC(2025, 9, 1);
  const span = Date.UTC(2026, 9, 1) - start - 1;
  const out: Order[] = [];
  for (let i = 0; i < count; i++) {
    const product = PRODUCTS[Math.floor(rnd() * PRODUCTS.length)] ?? PRODUCTS[0];
    const qty = 1 + Math.floor(rnd() * 4);
    const r = rnd();
    const status = r < 0.88 ? "paid" : r < 0.96 ? "pending" : "refunded";
    const cust = 1 + Math.floor(rnd() * 30);
    out.push(
      OrderSchema.parse({
        id: `ord_${String(i + 1).padStart(4, "0")}`,
        customerId: `cus_${String(cust).padStart(3, "0")}`,
        product,
        amount: PRICE[product] * qty,
        status,
        createdAt: new Date(start + Math.floor(rnd() * span)).toISOString(),
      }),
    );
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const SEED_ORDERS: readonly Order[] = makeOrders();
