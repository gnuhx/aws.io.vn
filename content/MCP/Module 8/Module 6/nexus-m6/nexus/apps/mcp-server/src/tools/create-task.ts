import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTaskInputSchema, TaskOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerCreateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTask,
    {
      title: "Giao việc",
      description: "Tạo việc mới (trạng thái todo) cho 1 người, có thể gắn khách và hạn.",
      inputSchema: CreateTaskInputSchema.shape,
      outputSchema: TaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ title, assignee, customerId, dueDate }) => {
      if (customerId && !(await deps.customers.get(customerId))) {
        return toolFail(`Không có khách ${customerId}. Dùng nexus_list_customers để tìm đúng id.`);
      }
      const task = await deps.tasks.create({ title, assignee, customerId: customerId ?? null, dueDate: dueDate ?? null });
      return toolOk({ task });
    },
  );
}
