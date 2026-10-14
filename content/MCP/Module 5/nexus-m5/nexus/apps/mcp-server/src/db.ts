import { MongoClient, type Db } from "mongodb";

/** Kết nối Mongo dùng chung trong process (M2 · S2.2). */
export async function connectMongo(uri: string): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3_000, appName: "nexus-mcp" });
  await client.connect();
  return { db: client.db(), close: () => client.close() };
}
