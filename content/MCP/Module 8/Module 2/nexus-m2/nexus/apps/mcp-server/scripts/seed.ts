/**
 * Seed dữ liệu mẫu vào Mongo (idempotent: chạy lại bao nhiêu lần cũng ra cùng kết quả).
 *   MONGODB_URI="mongodb://localhost:27017/?directConnection=true" node scripts/seed.ts
 */
import { connectMongo } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";
import { createLogger } from "../src/log.ts";
import { customersCollection, toDoc } from "../src/customers/mongo-repository.ts";
import { SEED_CUSTOMERS } from "../src/customers/seed-data.ts";

const env = loadEnv();
if (env.NEXUS_DATA !== "mongo") throw new Error("seed cần NEXUS_DATA=mongo");
const log = createLogger("info");
const { client, db } = await connectMongo(env, log);

try {
  const col = customersCollection(db);
  await col.createIndex({ cityKey: 1, createdAt: -1 }, { name: "cityKey_createdAt" });
  const ops = SEED_CUSTOMERS.map((c) => {
    const doc = toDoc(c);
    return { replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } };
  });
  const res = await col.bulkWrite(ops, { ordered: false });
  const byCity = await col
    .aggregate<{ _id: string; n: number }>([{ $group: { _id: "$city", n: { $sum: 1 } } }, { $sort: { n: -1 } }])
    .toArray();
  console.log(`upserted=${res.upsertedCount} matched=${res.matchedCount} total=${await col.countDocuments()}`);
  for (const row of byCity) console.log(`  ${row._id.padEnd(10)} ${row.n}`);
} finally {
  await client.close();
}
