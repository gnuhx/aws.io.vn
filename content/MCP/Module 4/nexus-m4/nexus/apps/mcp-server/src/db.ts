import { MongoClient } from "mongodb";
import type { Env } from "./env.ts";
import type { Logger } from "./log.ts";
import type { CustomerRepository } from "./customers/repository.ts";
import { createMongoRepository } from "./customers/mongo-repository.ts";
import { createMemoryRepository } from "./customers/memory-repository.ts";
import { SEED_CUSTOMERS } from "./customers/seed-data.ts";

export interface DataSource {
  customers: CustomerRepository;
  close(): Promise<void>;
}

export async function openDataSource(env: Env, log: Logger): Promise<DataSource> {
  if (env.NEXUS_DATA === "memory") {
    log.info("data source: memory", { customers: SEED_CUSTOMERS.length });
    return { customers: createMemoryRepository(SEED_CUSTOMERS), close: async () => {} };
  }
  const client = new MongoClient(env.MONGO_URL, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  log.info("data source: mongo", { db: env.MONGO_DB });
  return { customers: createMongoRepository(client.db(env.MONGO_DB)), close: () => client.close() };
}
