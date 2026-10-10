/**
 * Chứng minh replica set hoạt động: in trạng thái member + chạy 1 transaction 2 collection.
 * Trên standalone mongod, bước transaction sẽ lỗi — đó chính là mục đích của script.
 *   MONGODB_URI="mongodb://localhost:27017/?directConnection=true" node scripts/tx-check.ts
 */
import { MongoServerError } from "mongodb";
import { connectMongo } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";
import { createLogger } from "../src/log.ts";
import { customersCollection } from "../src/customers/mongo-repository.ts";

interface RsMember { name: string; stateStr: string; health: number }
interface RsStatus { set: string; members: RsMember[] }
interface AuditDoc { customerId: string; action: string; at: Date }

const env = loadEnv();
if (env.NEXUS_DATA !== "mongo") throw new Error("tx-check cần NEXUS_DATA=mongo");
const { client, db } = await connectMongo(env, createLogger("warn"));

try {
  const rs = await db.admin().command({ replSetGetStatus: 1 }) as unknown as RsStatus;
  console.log(`replica set: ${rs.set}`);
  for (const m of rs.members) console.log(`  ${m.name}  ${m.stateStr}  health=${m.health}`);

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await customersCollection(db).updateOne(
        { _id: "cus_001" }, { $set: { tier: "enterprise" } }, { session });
      await db.collection<AuditDoc>("audit").insertOne(
        { customerId: "cus_001", action: "tier->enterprise", at: new Date() }, { session });
    });
    console.log("transaction: committed ✓");
  } finally {
    await session.endSession();
  }
} catch (err) {
  if (err instanceof MongoServerError) console.error(`MongoServerError code=${err.code}: ${err.message}`);
  else throw err;
  process.exitCode = 1;
} finally {
  await client.close();
}
