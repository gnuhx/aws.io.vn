import type { Customer, CustomerId } from "@nexus/shared";
import { fold } from "../text.ts";
import type { CustomerFilter, CustomerPatch, CustomerRepository } from "./repository.ts";

export function createMemoryCustomers(seed: readonly Customer[]): CustomerRepository {
  const rows = new Map<string, Customer>(seed.map((c) => [c.id, { ...c }]));
  const where = (f: CustomerFilter) => (c: Customer): boolean => (!f.city || c.city === f.city) && (!f.tier || c.tier === f.tier);
  return {
    async list(filter: CustomerFilter, limit: number) {
      const all = [...rows.values()].filter(where(filter));
      return { total: all.length, items: all.slice(0, limit) };
    },
    async search(q: string, filter: CustomerFilter, limit: number) {
      const k = fold(q.trim());
      const rank = (c: Customer): number => (c.id.startsWith(k) ? 0 : fold(c.name).startsWith(k) ? 1 : fold(c.name).includes(k) ? 2 : 3);
      return [...rows.values()]
        .filter(where(filter))
        .map((c) => ({ c, r: rank(c) }))
        .filter((x) => x.r < 3)
        .sort((a, b) => a.r - b.r || a.c.id.localeCompare(b.c.id))
        .slice(0, limit)
        .map((x) => x.c);
    },
    async get(id: CustomerId) {
      return rows.get(id);
    },
    async update(id: CustomerId, patch: CustomerPatch) {
      const cur = rows.get(id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch };
      rows.set(id, next);
      return next;
    },
  };
}
