import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { decodeCursor, encodeCursor } from "../tasks/cursor.ts";
import { keyOf } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ, lọc theo trạng thái, người phụ trách, khách, hạn (dueBefore cho \"việc quá hạn\"). Trả theo trang. " +
        "hasMore=true thì gọi lại với cursor = nextCursor và GIỮ NGUYÊN bộ lọc; hasMore=false là hết, không gọi tiếp.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listTasks, deps.log, async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor !== undefined) {
        const d = decodeCursor(cursor, filter);
        if (!d.ok) {
          return d.reason === "other_filter"
            ? toolFail({ what: "cursor này thuộc một bộ lọc khác.", next: "Gọi lại với đúng bộ lọc của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." })
            : toolFail({ what: "cursor không hợp lệ.", next: "Chép nguyên văn nextCursor của trang trước, hoặc bỏ cursor để bắt đầu từ trang đầu." });
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk(ListTasksOutputSchema, {
        returned: page.items.length,
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: encodeCursor(keyOf(last), filter) } : {}),
      });
    }),
  );
}
