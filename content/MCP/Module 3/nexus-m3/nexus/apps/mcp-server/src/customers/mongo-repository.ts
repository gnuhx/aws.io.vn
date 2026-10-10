import type { Collection, Db, Filter } from "mongodb";
import { cityKey, CustomerSchema, type Customer } from "@nexus/shared";
import type { CustomerRepository } from "./repository.ts";

/** Hình dạng trong DB: _id, Date thật, thêm cityKey để query có index. */
export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  city: Customer["city"];
  cityKey: string;
  tier: Customer["tier"];
  createdAt: Date;
}

export function customersCollection(db: Db): Collection<CustomerDoc> {
  return db.collection<CustomerDoc>("customers");
}

export function toDoc(c: Customer): CustomerDoc {
  return { _id: c.id, name: c.name, email: c.email, city: c.city, cityKey: cityKey(c.city), tier: c.tier, createdAt: new Date(c.createdAt) };
}

/** Ranh giới tin cậy: document từ DB được parse lại bằng Zod. */
export function toCustomer(d: CustomerDoc): Customer {
  return CustomerSchema.parse({ id: d._id, name: d.name, email: d.email, city: d.city, tier: d.tier, createdAt: d.createdAt.toISOString() });
}

export function createMongoCustomerRepository(db: Db): CustomerRepository {
  const col = customersCollection(db);
  return {
    async list({ city, limit }) {
      const filter: Filter<CustomerDoc> = city ? { cityKey: cityKey(city) } : {};
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ createdAt: -1, _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    async get(id) {
      const doc = await col.findOne({ _id: id });
      return doc ? toCustomer(doc) : undefined;
    },
    async updateTier(id, tier) {
      // Trả document TRƯỚC khi sửa để biết gói cũ — 1 round-trip, không race giữa đọc và ghi
      const before = await col.findOneAndUpdate({ _id: id }, { $set: { tier } }, { returnDocument: "before" });
      if (!before) return undefined;
      return { previousTier: before.tier, tier, changed: before.tier !== tier };
    },
    async delete(id) {
      const res = await col.deleteOne({ _id: id });
      return res.deletedCount === 1;
    },
  };
}
