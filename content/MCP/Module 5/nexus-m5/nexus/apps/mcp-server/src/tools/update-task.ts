import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateTaskInputSchema, UpdateTaskOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateTask,
    {
      title: "Cập nhật việc",
      description:
        "Hoàn thành (status=done), chuyển trạng thái, giao lại (assignee), dời hạn (dueDate; null = bỏ hạn) hoặc sửa tiêu đề 1 việc. " +
        "Chỉ gửi field cần đổi. Kết quả có changed = các field thực sự đổi.",
      // Cả object (không phải .shape): giữ .refine "cần ít nhất 1 thay đổi" — .shape làm rơi refine
      inputSchema: UpdateTaskInputSchema,
      outputSchema: UpdateTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateTask, deps.log, async ({ id, ...patch }) => {
      const r = await deps.tasks.update(id, patch);
      if (!r) return toolFail({ what: `Không có việc ${id}.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(UpdateTaskOutputSchema, r);
    }),
  );
}
