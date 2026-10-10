// Nạp 30 khách mẫu vào MongoDB (cần replica set của infra/docker-compose.yml).
import { MongoClient } from "mongodb";
import { SEED_CUSTOMERS } from "../src/customers/seed-data.ts";
import { fold } from "../src/customers/repository.ts";
import { loadEnv } from "../src/env.ts";

const env = loadEnv();
const client = new MongoClient(env.MONGO_URL);
await client.connect();
const col = client.db(env.MONGO_DB).collection<{ _id: string }>("customers");
await col.deleteMany({});
// nameFolded: tên bỏ dấu cho nexus_search_customers (M4)
await col.insertMany(SEED_CUSTOMERS.map(({ id, ...rest }) => ({ _id: id, ...rest, nameFolded: fold(rest.name) })));
process.stderr.write(`seed: ${await col.countDocuments()} customers\n`);
await client.close();
