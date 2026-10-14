import { MongoClient, type Db } from "mongodb";
import type { Env } from "./env.ts";
import type { Logger } from "./log.ts";
import { createMemoryCustomerRepository } from "./customers/memory-repository.ts";
import { createMongoCustomerRepository } from "./customers/mongo-repository.ts";
import type { CustomerRepository } from "./customers/repository.ts";
import { SEED_CUSTOMERS } from "./customers/seed-data.ts";

type MongoEnv = Extract<Env, { NEXUS_DATA: "mongo" }>;

export interface MongoHandle {
  client: MongoClient;
  db: Db;
}

/**
 * Mặc định driver chờ 30s để tìm server — tool sẽ treo 30s khi Mongo chết.
 * Hạ xuống 5s: fail nhanh, LLM nhận lỗi và nói lại với user.
 */
export async function connectMongo(env: MongoEnv, log: Logger): Promise<MongoHandle> {
  const client = new MongoClient(env.MONGODB_URI, {
    appName: "nexus-mcp",
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 10,
  });
  await client.connect();
  const db = client.db(env.MONGODB_DB);
  await db.command({ ping: 1 });
  log.info("mongo connected", { db: env.MONGODB_DB });
  return { client, db };
}

export interface DataSource {
  customers: CustomerRepository;
  close(): Promise<void>;
}

export async function openDataSource(env: Env, log: Logger): Promise<DataSource> {
  switch (env.NEXUS_DATA) {
    case "memory":
      return { customers: createMemoryCustomerRepository(SEED_CUSTOMERS), close: async () => {} };
    case "mongo": {
      const { client, db } = await connectMongo(env, log);
      return { customers: createMongoCustomerRepository(db), close: () => client.close() };
    }
  }
}
