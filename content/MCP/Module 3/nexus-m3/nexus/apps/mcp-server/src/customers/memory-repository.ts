import { cityKey, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Cùng hợp đồng với bản Mongo — dùng cho dev không có DB, smoke test, CI. */
export function createMemoryCustomerRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map<string, Customer>(seed.map((c) => [c.id, { ...c }]));
  const newestFirst = (a: Customer, b: Customer) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  return {
    async list({ city, limit }) {
      const key = city ? cityKey(city) : undefined;
      const hit = [...rows.values()].filter((c) => key === undefined || cityKey(c.city) === key).sort(newestFirst);
      return { total: hit.length, items: hit.slice(0, limit) };
    },
    async get(id) {
      const c = rows.get(id);
      return c ? { ...c } : undefined;
    },
    async updateTier(id, tier) {
      const c = rows.get(id);
      if (!c) return undefined;
      const previousTier = c.tier;
      c.tier = tier;
      return { previousTier, tier, changed: previousTier !== tier };
    },
    async delete(id) {
      return rows.delete(id);
    },
  };
}
