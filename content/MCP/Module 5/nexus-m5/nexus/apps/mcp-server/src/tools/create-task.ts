import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTaskInputSchema, TaskResultSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerCreateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTask,
    {
      title: "Giao việc",
      description: "Tạo 1 việc mới (trạng thái todo) giao cho 1 người, có thể gắn khách và hạn. Gọi khi người dùng muốn giao/ghi nhận việc cần làm.",
      inputSchema: CreateTaskInputSchema.shape,
      outputSchema: TaskResultSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.createTask, deps.log, async ({ title, assignee, customerId, dueDate }) => {
      if (customerId !== undefined && !(await deps.customers.get(customerId))) {
        return toolFail({ what: `Không có khách hàng ${customerId}.`, next: "Lấy id đúng bằng nexus_search_customers, hoặc tạo việc không gắn khách." });
      }
      const task = await deps.tasks.create({ title, assignee, customerId, dueDate });
      return toolOk(TaskResultSchema, { task });
    }),
  );
}
