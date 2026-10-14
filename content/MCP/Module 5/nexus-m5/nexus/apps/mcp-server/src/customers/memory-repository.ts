import { CITIES, type City, type Customer, type CustomerId, type Tier } from "@nexus/shared";
import { fold, type CustomerChange, type CustomerPage, type CustomerRepository, type TierChange } from "./repository.ts";

/** Bản RAM cùng hợp đồng với Mongo — dùng cho test, smoke và sandbox không có DB. */
export function createMemoryCustomerRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map(seed.map((c) => [c.id, { ...c }]));
  const listeners = new Set<(c: CustomerChange) => void>();
  const emit = (c: CustomerChange): void => {
    for (const l of listeners) l(c);
  };
  const sorted = (): Customer[] => [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    async list({ city, limit }) {
      const all = sorted().filter((c) => city === undefined || c.city === city);
      return { total: all.length, items: all.slice(0, limit) };
    },
    async get(id) {
      const c = rows.get(id);
      return c ? { ...c } : null;
    },
    async countByCity() {
      const out = Object.fromEntries(CITIES.map((c) => [c, 0])) as Record<City, number>;
      for (const c of rows.values()) out[c.city] += 1;
      return out;
    },
    async updateTier(id: CustomerId, tier: Tier): Promise<TierChange | null> {
      const c = rows.get(id);
      if (!c) return null;
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
    async search({ query, limit }): Promise<CustomerPage> {
      const q = fold(query);
      const all = sorted().filter((c) => fold(c.name).includes(q) || fold(c.email).includes(q));
      return { total: all.length, items: all.slice(0, limit) };
    },
    watch(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
