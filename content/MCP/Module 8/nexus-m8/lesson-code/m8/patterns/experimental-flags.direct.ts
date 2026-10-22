/**
 * BẢN DỊCH THẲNG TỪ C# (để so sánh — đừng dùng): `#if PREVIEW_TASKS` / feature flag rải khắp nơi, gọi thẳng API
 * experimental của SDK ở mọi chỗ cần. Qua tsc. Khi spec 2026-07-28 đổi Tasks (bỏ tasks/result, thêm tasks/update)
 * phải đi tìm từng `if (FLAGS.tasks)` và từng chỗ import `experimental` để sửa — và logic báo cáo nằm lẫn trong đó.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTaskStore } from "@modelcontextprotocol/sdk/experimental/tasks";

export const FLAGS = { tasks: process.env.NEXUS_TASKS !== "off" }; // static config, đọc ở mọi file

export class ReportService {
  // store experimental nằm trong service nghiệp vụ
  static readonly store = FLAGS.tasks ? new InMemoryTaskStore() : undefined;

  static register(server: McpServer): void {
    if (FLAGS.tasks) {
      server.experimental.tasks.registerToolTask(
        "nexus_generate_report",
        { description: "Báo cáo", execution: { taskSupport: "optional" } },
        {
          async createTask(extra) {
            const task = await extra.taskStore.createTask({ ttl: 60_000 });
            // ... logic báo cáo chép vào đây (bản 1)
            return { task };
          },
          getTask: async (extra) => (await extra.taskStore.getTask(extra.taskId))!,
          getTaskResult: async (extra) => (await extra.taskStore.getTaskResult(extra.taskId)) as { content: [] },
        },
      );
    } else {
      server.registerTool("nexus_generate_report", { description: "Báo cáo" }, async () => {
        // ... logic báo cáo chép vào đây (bản 2) — 2 bản sẽ lệch nhau
        return { content: [] };
      });
    }
  }
}
