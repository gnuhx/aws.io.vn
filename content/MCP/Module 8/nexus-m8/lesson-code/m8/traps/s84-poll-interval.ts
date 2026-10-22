/**
 * BẪY S8.4 · 1 — tool Task với taskSupport "optional", client ĐỜI CŨ gọi tools/call bình thường (không xin task).
 * SDK 1.30.1 tự tạo task rồi CHỜ bằng cách poll store — mỗi `pollInterval` ms. Không đặt: InMemoryTaskStore điền 1000
 * (store tự viết không điền thì McpServer lùi về 5000). Việc thật 300 ms, client cũ đợi ~1 giây.
 *   node traps/s84-poll-interval.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTaskStore } from "@modelcontextprotocol/sdk/experimental/tasks";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

async function timePlainCall(pollInterval: number | undefined): Promise<number> {
  const store = new InMemoryTaskStore();
  const server = new McpServer(
    { name: "poll", version: "1.0.0" },
    { capabilities: { tasks: { requests: { tools: { call: {} } } } }, taskStore: store },
  );
  server.experimental.tasks.registerToolTask(
    "slow_report",
    { description: "việc 300 ms", execution: { taskSupport: "optional" } },
    {
      async createTask(extra) {
        const task = await extra.taskStore.createTask(pollInterval === undefined ? { ttl: 60_000 } : { ttl: 60_000, pollInterval });
        setTimeout(() => void store.storeTaskResult(task.taskId, "completed", { content: [{ type: "text", text: "xong" }] }), 300);
        return { task };
      },
      getTask: async (extra) => (await extra.taskStore.getTask(extra.taskId))!,
      getTaskResult: async (extra) => (await extra.taskStore.getTaskResult(extra.taskId)) as { content: [] },
    },
  );
  const client = new Client({ name: "client-doi-cu", version: "1.0.0" }); // không biết Tasks
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);
  await client.connect(ct);
  const t0 = performance.now();
  await client.callTool({ name: "slow_report" });
  const ms = Math.round(performance.now() - t0);
  await client.close();
  store.cleanup();
  return ms;
}

console.log(`không đặt pollInterval  → client cũ chờ ${await timePlainCall(undefined)} ms cho việc 300 ms`);
console.log(`pollInterval: 250        → client cũ chờ ${await timePlainCall(250)} ms`);
