/** Nạp 30 khách mẫu vào Mongo — idempotent (chạy lại không tạo trùng). */
import { MongoClient } from "mongodb";
import { loadEnv } from "../src/env.ts";
import { customersCollection, toDoc } from "../src/customers/mongo-repository.ts";
import { SEED_CUSTOMERS } from "../src/customers/seed-data.ts";

const env = loadEnv();
if (env.NEXUS_DATA !== "mongo") {
  process.stderr.write("seed cần NEXUS_DATA=mongo và MONGODB_URI\n");
  process.exit(1);
}
const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
try {
  await client.connect();
  const col = customersCollection(client.db(env.MONGODB_DB));
  await col.createIndex({ cityKey: 1, createdAt: -1 }, { name: "cityKey_createdAt" });
  const res = await col.bulkWrite(
    SEED_CUSTOMERS.map((c) => ({ replaceOne: { filter: { _id: c.id }, replacement: toDoc(c), upsert: true } })),
  );
  const total = await col.countDocuments();
  console.log(`upserted=${res.upsertedCount} matched=${res.matchedCount} total=${total}`);
  const byCity = await col.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }]).toArray();
  console.table(byCity);
} finally {
  await client.close();
}
