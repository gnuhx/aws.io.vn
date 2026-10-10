import type { CustomerRepository } from "./customers/repository.ts";
import { createMemoryCustomerRepository } from "./customers/memory-repository.ts";
import { createMongoCustomerRepository } from "./customers/mongo-repository.ts";
import { seedCustomers } from "./customers/seed-data.ts";
import { connectMongo } from "./db.ts";
import type { Env } from "./env.ts";
import { openRoot } from "./files/safe-path.ts";
import { createHttpHelpdesk } from "./helpdesk/http-helpdesk.ts";
import type { HelpdeskPort } from "./helpdesk/port.ts";
import { createApiClient } from "./http/api-client.ts";
import { createMongoOrderRepository } from "./orders/mongo-repository.ts";
import { createMemoryOrderRepository, type OrderRepository } from "./orders/repository.ts";
import { seedOrders } from "./orders/seed-data.ts";
import { createMemoryReadOnlyStore } from "./query/memory-store.ts";
import { createMongoReadOnlyStore } from "./query/mongo-store.ts";
import type { ReadOnlyStore, Row } from "./query/store.ts";
import { createMemoryTaskRepository } from "./tasks/memory-repository.ts";
import { createMongoTaskRepository } from "./tasks/mongo-repository.ts";
import type { TaskRepository } from "./tasks/repository.ts";
import { seedTasks } from "./tasks/seed-data.ts";
import { createLogger, type Logger } from "./log.ts";
import { createRatesClient, type RatesClient } from "./rates/client.ts";

/** Mọi thứ tool cần — composition root ghép 1 lần, tool nhận qua tham số (M3). */
export interface Deps {
  log: Logger;
  customers: CustomerRepository;
  rates: RatesClient;
  /** realpath của thư mục export (M5 · S5.1) */
  exportsDir: string;
  orders: OrderRepository;
  /** Cửa chỉ đọc cho nexus_query (M5 · S5.2) */
  query: ReadOnlyStore;
  /** Helpdesk bên ngoài qua client HTTP chung (M5 · S5.3) */
  helpdesk: HelpdeskPort;
  /** Việc nội bộ (M5 · S5.5) */
  tasks: TaskRepository;
  close(): Promise<void>;
}

export function helpdeskFromEnv(env: Pick<Env, "HELPDESK_URL" | "HELPDESK_TOKEN">, log: Logger): HelpdeskPort {
  const token = env.HELPDESK_TOKEN;
  return createHttpHelpdesk(
    createApiClient({
      name: "Helpdesk",
      baseUrl: env.HELPDESK_URL,
      timeoutMs: 3_000,
      retry: { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 2_000, maxWaitMs: 5_000, budgetMs: 10_000 },
      auth: () => (token ? { authorization: `Bearer ${token}` } : {}),
      log,
    }),
  );
}

/** Store RAM đọc từ repository — cùng hợp đồng với store Mongo dùng user read-only. */
export function memoryQueryStore(customers: CustomerRepository, orders: OrderRepository, tasks: TaskRepository): ReadOnlyStore {
  return createMemoryReadOnlyStore({
    customers: async () => (await customers.list({ limit: 1_000_000 })).items as readonly Row[],
    orders: async () => (await orders.all()) as readonly Row[],
    tasks: async () => (await tasks.page({}, undefined, 1_000_000)).items as readonly Row[],
  });
}

export async function createDeps(env: Env): Promise<Deps> {
  const log = createLogger();
  const rates = createRatesClient(env.RATES_URL, env.RATES_TIMEOUT_MS);
  const exportsDir = await openRoot(env.NEXUS_EXPORT_DIR);
  const helpdesk = helpdeskFromEnv(env, log);
  if (env.NEXUS_DATA === "memory") {
    const seed = seedCustomers();
    const customers = createMemoryCustomerRepository(seed);
    const orders = createMemoryOrderRepository(seedOrders(seed));
    const tasks = createMemoryTaskRepository(seedTasks());
    return { log, rates, exportsDir, helpdesk, customers, orders, tasks, query: memoryQueryStore(customers, orders, tasks), close: async () => undefined };
  }
  const mongo = await connectMongo(env.MONGO_URI);
  const ro = await createMongoReadOnlyStore(env.MONGO_READONLY_URI);
  return {
    log,
    rates,
    exportsDir,
    helpdesk,
    customers: createMongoCustomerRepository(mongo.db),
    orders: createMongoOrderRepository(mongo.db),
    tasks: createMongoTaskRepository(mongo.db),
    query: ro.store,
    close: async () => {
      await Promise.all([mongo.close(), ro.close()]);
    },
  };
}
