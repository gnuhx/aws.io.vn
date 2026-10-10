import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerListCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, có thể lọc theo thành phố. Gọi khi người dùng hỏi \"bao nhiêu khách\", \"khách ở X\". " +
        "Đếm bằng field total (items bị cắt theo limit). Tìm theo tên thì dùng nexus_search_customers.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
