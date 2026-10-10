import { CustomerSchema, cityKey, type Customer } from "@nexus/shared";
import type { Collection, Db, Filter } from "mongodb";
import type { CustomerPage, CustomerQuery, CustomerRepository } from "./repository.ts";

/** Hình dạng document TRONG Mongo — khác domain type: _id, Date thật, cityKey để query. */
export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  city: string;
  cityKey: string;
  tier: string;
  createdAt: Date;
}

export const CUSTOMERS = "customers";

export function customersCollection(db: Db): Collection<CustomerDoc> {
  return db.collection<CustomerDoc>(CUSTOMERS);
}

export function toDoc(c: Customer): CustomerDoc {
  return { _id: c.id, name: c.name, email: c.email, city: c.city, cityKey: cityKey(c.city),
    tier: c.tier, createdAt: new Date(c.createdAt) };
}

/** DB là ranh giới tin cậy: parse lại bằng Zod, document hỏng thì nổ ở đây chứ không lọt vào LLM. */
function toCustomer(d: CustomerDoc): Customer {
  return CustomerSchema.parse({ id: d._id, name: d.name, email: d.email, city: d.city,
    tier: d.tier, createdAt: d.createdAt.toISOString() });
}

export function createMongoCustomerRepository(db: Db): CustomerRepository {
  const col = customersCollection(db);
  return {
    async list({ city, limit }: CustomerQuery): Promise<CustomerPage> {
      const filter: Filter<CustomerDoc> = city === undefined ? {} : { cityKey: cityKey(city) };
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
  };
}
