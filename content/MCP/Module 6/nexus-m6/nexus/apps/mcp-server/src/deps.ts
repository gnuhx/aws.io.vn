import { randomBytes } from "node:crypto";
import path from "node:path";
import type { Env } from "./env.ts";
import { createLogger, type Logger } from "./log.ts";
import type { CustomerRepository } from "./customers/repository.ts";
import { createMemoryCustomers } from "./customers/memory-repository.ts";
import { SEED_CUSTOMERS } from "./customers/seed-data.ts";
import { createMemoryOrders, type OrderRepository } from "./orders/repository.ts";
import { SEED_ORDERS } from "./orders/seed-data.ts";
import { createCursorCodec, type CursorCodec } from "./tasks/cursor.ts";
import type { TaskRepository } from "./tasks/repository.ts";
import { createMemoryTasks } from "./tasks/memory-repository.ts";
import { SEED_TASKS } from "./tasks/seed-data.ts";

/** Composition root: chỗ DUY NHẤT biết cài đặt cụ thể. Tool chỉ thấy interface. */
export interface Deps {
  customers: CustomerRepository;
  orders: OrderRepository;
  tasks: TaskRepository;
  /** Ký + kiểm cursor của nexus_list_tasks (S6.4). */
  cursor: CursorCodec;
  log: Logger;
  now: () => Date;
  exportsDir: string;
  /** Chờ người duyệt + LLM của client tối đa bao lâu cho 1 request sampling (S6.2). */
  samplingTimeoutMs: number;
  /** Xóa khi client không hỏi được người dùng? (S6.3) */
  deleteWithoutElicitation: "deny" | "allow";
}

export function createDeps(env: Env, overrides: Partial<Deps> = {}): Deps {
  const cityOf = new Map(SEED_CUSTOMERS.map((c) => [c.id, c.city]));
  const now = overrides.now ?? (() => new Date());
  const log = overrides.log ?? createLogger(env.NEXUS_LOG_LEVEL);
  if (!env.NEXUS_CURSOR_SECRET) log.warn("NEXUS_CURSOR_SECRET chưa đặt — khóa ngẫu nhiên, cursor mất hiệu lực khi restart");
  const secret = env.NEXUS_CURSOR_SECRET ? Buffer.from(env.NEXUS_CURSOR_SECRET) : randomBytes(32);
  return {
    customers: createMemoryCustomers(SEED_CUSTOMERS),
    orders: createMemoryOrders(SEED_ORDERS, (id) => cityOf.get(id) ?? null),
    tasks: createMemoryTasks(SEED_TASKS, now),
    cursor: createCursorCodec({ secret, ttlMs: env.NEXUS_CURSOR_TTL_S * 1000, now }),
    log,
    now,
    exportsDir: path.resolve(env.NEXUS_EXPORT_DIR),
    samplingTimeoutMs: env.NEXUS_SAMPLING_TIMEOUT_MS,
    deleteWithoutElicitation: env.NEXUS_DELETE_WITHOUT_ELICITATION,
    ...overrides,
  };
}
