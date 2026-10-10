import { CITIES, type City, type Customer, type CustomerId, type Tier } from "@nexus/shared";
import { fold, type CustomerChange, type CustomerPage, type CustomerRepository, type TierChange } from "./repository.ts";

/** Repository trong RAM — cùng hợp đồng với bản Mongo. Dùng cho dev, test, sandbox. */
export function createMemoryRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map(seed.map((c) => [c.id, { ...c }]));
  const listeners = new Set<(c: CustomerChange) => void>();
  const emit = (c: CustomerChange): void => {
    for (const l of listeners) l(c);
  };
  return {
    async list({ city, limit }): Promise<CustomerPage> {
      const all = [...rows.values()].filter((c) => city === undefined || c.city === city);
      return { total: all.length, items: all.slice(0, limit) };
    },
    async get(id: CustomerId) {
      const c = rows.get(id);
      return c && { ...c };
    },
    async countByCity() {
      const out = Object.fromEntries(CITIES.map((c) => [c, 0])) as Record<City, number>;
      for (const c of rows.values()) out[c.city] += 1;
      return out;
    },
    async updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined> {
      const c = rows.get(id);
      if (!c) return undefined;
      const previousTier = c.tier;
      c.tier = tier;
      const changed = previousTier !== tier;
      if (changed) emit({ kind: "updated", id }); // đặt lại cùng gói: không có gì để báo
      return { previousTier, changed };
    },
    async delete(id: CustomerId) {
      const deleted = rows.delete(id);
      if (deleted) emit({ kind: "deleted", id });
      return deleted;
    },
    async search({ query, city, limit }): Promise<CustomerPage> {
      const q = fold(query);
      const all = [...rows.values()].filter(
        (c) => (city === undefined || c.city === city) && (fold(c.name).includes(q) || c.email.toLowerCase().includes(q)),
      );
      return { total: all.length, items: all.slice(0, limit) };
    },
    watch(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
