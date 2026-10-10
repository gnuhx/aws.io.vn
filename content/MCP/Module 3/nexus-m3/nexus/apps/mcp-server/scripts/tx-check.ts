/** Chứng minh replica set hoạt động: in trạng thái member rồi chạy 1 transaction 2 lệnh. */
import { MongoClient } from "mongodb";
import { loadEnv } from "../src/env.ts";

const env = loadEnv();
if (env.NEXUS_DATA !== "mongo") {
  process.stderr.write("tx-check cần NEXUS_DATA=mongo và MONGODB_URI\n");
  process.exit(1);
}
const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
try {
  await client.connect();
  const status = await client.db("admin").command({ replSetGetStatus: 1 });
  for (const m of status["members"] as Array<{ name: string; stateStr: string; health: number }>) {
    console.log(`${m.name}  ${m.stateStr}  health=${m.health}`);
  }
  const db = client.db(env.MONGODB_DB);
  const probe = db.collection<{ _id: string; n: number }>("tx_probe");
  const audit = db.collection<{ at: Date; note: string }>("tx_audit");
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      // Mỗi lệnh PHẢI nhận { session } — không có ambient transaction như TransactionScope
      await probe.updateOne({ _id: "counter" }, { $inc: { n: 1 } }, { upsert: true, session });
      await audit.insertOne({ at: new Date(), note: "tx-check" }, { session });
    });
    console.log("transaction: committed ✓");
  } finally {
    await session.endSession();
  }
} finally {
  await client.close();
}
