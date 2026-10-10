import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteTaskInputSchema, DeleteTaskOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerDeleteTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteTask,
    {
      title: "Xóa việc",
      description: "Xóa vĩnh viễn 1 việc tạo nhầm. Việc đã làm xong thì dùng nexus_update_task status=done, KHÔNG xóa.",
      inputSchema: DeleteTaskInputSchema.shape,
      outputSchema: DeleteTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteTask, deps.log, async ({ id }) => {
      if (!(await deps.tasks.delete(id))) return toolFail({ what: `Không có việc ${id} để xóa.`, next: "Tìm id bằng nexus_list_tasks." });
      return toolOk(DeleteTaskOutputSchema, { id, deleted: true });
    }),
  );
}
