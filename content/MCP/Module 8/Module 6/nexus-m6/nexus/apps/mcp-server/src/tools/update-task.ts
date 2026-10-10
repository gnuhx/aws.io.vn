import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateTaskInputSchema, UpdateTaskOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateTask,
    {
      title: "Cập nhật việc",
      description: "Đổi trạng thái (xong = status done), người làm, tiêu đề hoặc hạn của 1 việc. Chỉ gửi field cần đổi.",
      // cả object, KHÔNG .shape: .shape làm rơi .refine "ít nhất 1 thay đổi" (M5 · S5.5 · Bẫy 3)
      inputSchema: UpdateTaskInputSchema,
      outputSchema: UpdateTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...patch }) => {
      const r = await deps.tasks.update(id, patch);
      return r ? toolOk(r) : toolFail(`Không có việc ${id}. Dùng nexus_list_tasks để tìm đúng id.`);
    },
  );
}
