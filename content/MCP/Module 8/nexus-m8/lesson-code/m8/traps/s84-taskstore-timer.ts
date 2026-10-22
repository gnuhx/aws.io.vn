/**
 * BẪY S8.4 · 2 — InMemoryTaskStore (experimental, SDK 1.30.1) hẹn setTimeout(ttl) cho mỗi task, không unref().
 * Script/test đã xong việc nhưng process không thoát tới khi hết TTL. `node traps/s84-taskstore-timer.ts [--cleanup]`
 */
import { InMemoryTaskStore } from "@modelcontextprotocol/sdk/experimental/tasks";

const store = new InMemoryTaskStore();
const task = await store.createTask({ ttl: 15 * 60_000, pollInterval: 250 }, 1, { method: "tools/call", params: {} });
await store.storeTaskResult(task.taskId, "completed", { content: [] });
console.log(`task ${task.taskId.slice(0, 8)}… completed — hết code, process có thoát không?`);
if (process.argv.includes("--cleanup")) store.cleanup();
