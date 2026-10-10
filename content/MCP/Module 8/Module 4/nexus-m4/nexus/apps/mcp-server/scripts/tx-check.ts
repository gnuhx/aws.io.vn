// Chứng minh replica set hoạt động: transaction chỉ chạy được trên replica set (M2 · S2.2).
import { MongoClient } from "mongodb";
import { loadEnv } from "../src/env.ts";

const env = loadEnv();
const client = new MongoClient(env.MONGO_URL);
await client.connect();
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const col = client.db(env.MONGO_DB).collection<{ _id: string; at: Date }>("tx_check");
    await col.updateOne({ _id: "probe" }, { $set: { at: new Date() } }, { upsert: true, session });
  });
  process.stderr.write("transaction committed ✓\n");
} finally {
  await session.endSession();
  await client.close();
}
