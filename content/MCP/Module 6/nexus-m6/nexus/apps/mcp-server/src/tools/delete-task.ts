import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteTaskInputSchema, DeleteTaskOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { askUser } from "../elicit/ask-user.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const REASONS = ["tạo nhầm", "bị trùng", "khách hủy yêu cầu"] as const;

export function registerDeleteTask(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteTask,
    {
      title: "Xóa việc",
      description:
        "Xóa hẳn 1 việc tạo nhầm — server sẽ hỏi người dùng xác nhận. " +
        "Việc đã làm xong thì KHÔNG xóa — dùng nexus_update_task status=done.",
      inputSchema: DeleteTaskInputSchema.shape,
      outputSchema: DeleteTaskOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }, extra) => {
      const task = await deps.tasks.get(id);
      if (!task) return toolFail(`Không có việc ${id} (có thể đã bị xóa). Dùng nexus_list_tasks để tìm đúng id.`);

      const ask = await askUser(
        server.server,
        `Xóa hẳn việc ${id} “${task.title}” (${task.assignee}, ${task.status})? Không khôi phục được.`,
        {
          confirm: { type: "boolean", title: "Tôi đồng ý xóa", default: false },
          reason: { type: "string", title: "Lý do", enum: REASONS },
        },
        { signal: extra.signal, relatedRequestId: extra.requestId },
      );

      if (ask.action === "unsupported") {
        if (deps.deleteWithoutElicitation === "deny") {
          return toolFail(
            "Client này không hỏi được người dùng (không hỗ trợ elicitation) nên Nexus không xóa. " +
              `Nhờ người dùng tự xóa trong app Nexus, hoặc đổi trạng thái: nexus_update_task {"id":"${id}","status":"done"}.`,
          );
        }
        deps.log.warn("xóa không qua elicitation (NEXUS_DELETE_WITHOUT_ELICITATION=allow)", { id });
      } else if (ask.action !== "accept" || ask.values.confirm !== true) {
        const why = ask.action === "cancel" ? "người dùng đóng hộp thoại" : "người dùng không đồng ý";
        return toolOk({ deleted: false, id, note: `Không xóa: ${why}. Đừng gọi lại trừ khi người dùng yêu cầu.` });
      }

      const deleted = await deps.tasks.delete(id);
      const reason = ask.action === "accept" ? (ask.values.reason ?? "không ghi") : "host đã xác nhận";
      deps.log.info("đã xóa việc", { id, reason });
      return toolOk({ deleted, id, note: `Đã xóa (lý do: ${reason}).` });
    },
  );
}
