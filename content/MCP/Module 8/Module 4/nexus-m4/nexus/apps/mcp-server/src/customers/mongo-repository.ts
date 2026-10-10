import type { ChangeStreamDocument, Collection, Db } from "mongodb";
import { CITIES, type City, type Customer, type CustomerId, type Tier } from "@nexus/shared";
import { fold, type CustomerChange, type CustomerPage, type CustomerRepository, type TierChange } from "./repository.ts";

type CustomerDoc = Customer & { _id: string; nameFolded?: string };

const toCustomer = ({ _id, nameFolded: _n, ...rest }: CustomerDoc): Customer => ({ ...rest, id: _id });
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function createMongoRepository(db: Db): CustomerRepository {
  const col: Collection<CustomerDoc> = db.collection<CustomerDoc>("customers");
  return {
    async list({ city, limit }): Promise<CustomerPage> {
      const filter = city === undefined ? {} : { city };
      const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter).sort({ _id: 1 }).limit(limit).toArray(),
      ]);
      return { total, items: docs.map(toCustomer) };
    },
    async get(id: CustomerId) {
      const doc = await col.findOne({ _id: id });
      return doc ? toCustomer(doc) : undefined;
    },
    async countByCity() {
      const out = Object.fromEntries(CITIES.map((c) => [c, 0])) as Record<City, number>;
      const rows = await col.aggregate<{ _id: City; n: number }>([{ $group: { _id: "$city", n: { $sum: 1 } } }]).toArray();
      for (const r of rows) out[r._id] = r.n;
      return out;
    },
    async updateTier(id: CustomerId, tier: Tier): Promise<TierChange | undefined> {
      // findOneAndUpdate trả bản TRƯỚC khi sửa → biết previousTier trong 1 lượt
      const before = await col.findOneAndUpdate({ _id: id }, { $set: { tier } }, { returnDocument: "before" });
      if (!before) return undefined;
      return { previousTier: before.tier, changed: before.tier !== tier };
    },
    async delete(id: CustomerId) {
      const r = await col.deleteOne({ _id: id });
      return r.deletedCount === 1;
    },
    async search({ query, city, limit }): Promise<CustomerPage> {
      // nameFolded (tên đã bỏ dấu) do seed/ghi dữ liệu điền; regex đã escape — chuỗi của LLM không thành pattern
      const re = new RegExp(escapeRe(fold(query)));
      const filter = { ...(city !== undefined && { city }), $or: [{ nameFolded: re }, { email: re }] };
      const [total, docs] = await Promise.all([col.countDocuments(filter), col.find(filter).sort({ _id: 1 }).limit(limit).toArray()]);
      return { total, items: docs.map(toCustomer) };
    },
    watch(listener) {
      // Change stream: bắt cả thay đổi từ process KHÁC (script, web, mongosh). Cần replica set (M2 · S2.2).
      const stream = col.watch<CustomerDoc, ChangeStreamDocument<CustomerDoc>>([], { fullDocument: "default" });
      stream.on("change", (ev) => {
        const map: Partial<Record<string, CustomerChange["kind"]>> = { insert: "created", update: "updated", replace: "updated", delete: "deleted" };
        const kind = map[ev.operationType];
        if (kind && "documentKey" in ev) listener({ kind, id: String(ev.documentKey._id) });
      });
      stream.on("error", () => undefined); // mất kết nối: driver tự thử lại khi còn resume token
      return () => void stream.close();
    },
  };
}
