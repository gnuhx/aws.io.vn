import { cityKey, type Customer } from "@nexus/shared";
import type { CustomerPage, CustomerQuery, CustomerRepository } from "./repository.ts";

/** Repository trong RAM: cho smoke test, CI và máy chưa có Mongo. Cùng hợp đồng với bản Mongo. */
export function createMemoryCustomerRepository(seed: readonly Customer[]): CustomerRepository {
  const rows = [...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    async list({ city, limit }: CustomerQuery): Promise<CustomerPage> {
      const key = city === undefined ? undefined : cityKey(city);
      const matched = key === undefined ? rows : rows.filter((c) => cityKey(c.city) === key);
      return { total: matched.length, items: matched.slice(0, limit) };
    },
  };
}
