import { CITIES, type City, type Customer, type CustomerId, type Tier } from "@nexus/shared";
import type { Collection, Db } from "mongodb";
import { fold, type CustomerChange, type CustomerRepository } from "./repository.ts";

type CustomerDoc = Omit<Customer, "id"> & { _id: string; nameFolded: string; emailFolded: string };

const toCustomer = ({ _id, nameFolded: _n, emailFolded: _e, ...rest }: CustomerDoc): Customer => ({
  id: _id as CustomerId,
  ...rest,
});

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bản Mongo — cùng hợp đồng với bản RAM. Chưa chạy ở sandbox dựng bài (không có Mongo). */
export function createMongoCustomerRepository(db: Db): CustomerRepository {
  const col: Collection<CustomerDoc> = db.collection<CustomerDoc>("customers");
  return {
    async list({ city, limit }) {
      const filter = city === undefined ? {} : { city };
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    async get(id) {
      const doc = await col.findOne({ _id: id });
      return doc ? toCustomer(doc) : null;
    },
    async countByCity() {
      const out = Object.fromEntries(CITIES.map((c) => [c, 0])) as Record<City, number>;
      for await (const row of col.aggregate<{ _id: City; n: number }>([{ $group: { _id: "$city", n: { $sum: 1 } } }])) {
        out[row._id] = row.n;
      }
      return out;
    },
    async updateTier(id: CustomerId, tier: Tier) {
      const before = await col.findOneAndUpdate({ _id: id }, { $set: { tier } }, { returnDocument: "before" });
      if (!before) return null;
      return { previousTier: before.tier, changed: before.tier !== tier };
    },
    async delete(id: CustomerId) {
      const r = await col.deleteOne({ _id: id });
      return r.deletedCount === 1;
    },
    async search({ query, limit }) {
      const re = new RegExp(escapeRegex(fold(query)));
      const filter = { $or: [{ nameFolded: re }, { emailFolded: re }] };
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    watch(listener: (c: CustomerChange) => void) {
      // Change stream: bắt cả thay đổi từ process khác (cần replica set — M2 · S2.2)
      const stream = col.watch([], { fullDocument: "updateLookup" });
      stream.on("change", (ev) => {
        if (ev.operationType === "update" || ev.operationType === "replace") listener({ kind: "updated", id: ev.documentKey._id as CustomerId });
        else if (ev.operationType === "insert") listener({ kind: "created", id: ev.documentKey._id as CustomerId });
        else if (ev.operationType === "delete") listener({ kind: "deleted", id: ev.documentKey._id as CustomerId });
      });
      stream.on("error", () => undefined);
      return () => {
        void stream.close();
      };
    },
  };
}
