import { MongoClient } from "mongodb";
import type { Env } from "./env.ts";
import type { Logger } from "./log.ts";
import type { CustomerRepository } from "./customers/repository.ts";
import { createMongoCustomerRepository } from "./customers/mongo-repository.ts";
import { createMemoryCustomerRepository } from "./customers/memory-repository.ts";
import { SEED_CUSTOMERS } from "./customers/seed-data.ts";

export interface DataSource {
  customers: CustomerRepository;
  close(): Promise<void>;
}

/** 1 MongoClient cho cả process (có pool). Fail nhanh lúc boot nếu Mongo không phản hồi. */
export async function openDataSource(env: Env, log: Logger): Promise<DataSource> {
  if (env.NEXUS_DATA === "memory") {
    log.info("data source: memory", { customers: SEED_CUSTOMERS.length });
    return { customers: createMemoryCustomerRepository(SEED_CUSTOMERS), close: async () => {} };
  }
  const client = new MongoClient(env.MONGODB_URI, {
    appName: "nexus-mcp",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
  });
  await client.connect();
  const db = client.db(env.MONGODB_DB);
  await db.command({ ping: 1 });
  log.info("data source: mongo", { db: env.MONGODB_DB });
  return { customers: createMongoCustomerRepository(db), close: () => client.close() };
}
