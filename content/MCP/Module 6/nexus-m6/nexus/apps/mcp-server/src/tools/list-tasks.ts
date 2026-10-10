import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTasksInputSchema, ListTasksOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListTasks(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTasks,
    {
      title: "Danh sách việc",
      description:
        "Việc nội bộ của team, lọc theo trạng thái/người/khách/hạn, mới tạo trước → sau. " +
        "Còn trang thì có nextCursor: gọi lại với đúng bộ lọc + cursor đó. Không có nextCursor = hết.",
      inputSchema: ListTasksInputSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ cursor, limit, ...filter }) => {
      let after;
      if (cursor) {
        const d = deps.cursor.decode(cursor, filter);
        if (!d.ok) {
          switch (d.reason) {
            case "invalid":
              return toolFail("cursor không hợp lệ (bị sửa, hoặc không do Nexus cấp). Chép NGUYÊN VĂN nextCursor của lần gọi trước, hoặc bỏ cursor để lấy trang đầu.");
            case "expired":
              return toolFail(
                `cursor đã hết hạn (cấp lúc ${d.issuedAt.toISOString().slice(11, 16)} UTC). Gọi lại KHÔNG có cursor để lấy trang đầu — dữ liệu có thể đã đổi từ lúc đó.`,
              );
            case "other_filter":
              return toolFail("cursor này thuộc một bộ lọc khác. Gọi lại với đúng bộ lọc của lần trước, hoặc bỏ cursor để bắt đầu lại.");
          }
        }
        after = d.after;
      }
      const page = await deps.tasks.page(filter, after, limit);
      const last = page.items.at(-1);
      return toolOk({
        items: page.items,
        hasMore: page.hasMore,
        ...(page.hasMore && last ? { nextCursor: deps.cursor.encode(last, filter) } : {}),
      });
    },
  );
}
