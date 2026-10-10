import type { QueryCollection } from "@nexus/shared";
import { MongoClient, type Document, type Filter } from "mongodb";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

/**
 * Bản Mongo của ReadOnlyStore — kết nối RIÊNG bằng user chỉ có role "read" (infra/mongo/create-reader.js).
 * Chưa chạy ở sandbox dựng bài (không có MongoDB). Kiểm trên máy bạn: lệnh ở Lab Nexus S5.2.
 */
export async function createMongoReadOnlyStore(uri: string): Promise<{ store: ReadOnlyStore; close: () => Promise<void> }> {
  const client = new MongoClient(uri, {
    appName: "nexus-mcp-query",
    readPreference: "secondaryPreferred", // truy vấn của LLM không tranh tài nguyên với primary
    serverSelectionTimeoutMS: 3_000,
  });
  await client.connect();
  const db = client.db();
  const store: ReadOnlyStore = {
    async find(collection: QueryCollection, filter: Record<string, unknown>, opts: FindOptions) {
      const col = db.collection<Document>(collection);
      const f = filter as Filter<Document>;
      const projection = opts.fields ? Object.fromEntries(opts.fields.map((k) => [k, 1])) : undefined;
      const cursor = col
        .find(f, { maxTimeMS: 2_000, ...(projection ? { projection } : {}) })
        .limit(opts.limit);
      if (opts.sort) cursor.sort({ [opts.sort.field]: opts.sort.order === "asc" ? 1 : -1 });
      const [matched, docs] = await Promise.all([col.countDocuments(f, { maxTimeMS: 2_000 }), cursor.toArray()]);
      return { matched, items: docs.map(({ _id, ...rest }): Row => ({ id: _id, ...rest })) };
    },
  };
  return { store, close: () => client.close() };
}
