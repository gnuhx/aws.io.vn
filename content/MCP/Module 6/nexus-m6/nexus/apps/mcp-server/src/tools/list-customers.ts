import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolOk } from "../tool-result.ts";

export function registerListCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Liệt kê khách hàng (id, tên, thành phố, gói, ngành), lọc theo thành phố/gói, tối đa 50. " +
        "Cần chi tiết 1 khách thì dùng nexus_get_customer; cần doanh số thì dùng nexus_find_orders.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ city, tier, limit }) => {
      const r = await deps.customers.list({ city, tier }, limit);
      return toolOk({
        total: r.total,
        items: r.items.map(({ id, name, city: c, tier: t, industry }) => ({ id, name, city: c, tier: t, industry })),
      });
    },
  );
}
