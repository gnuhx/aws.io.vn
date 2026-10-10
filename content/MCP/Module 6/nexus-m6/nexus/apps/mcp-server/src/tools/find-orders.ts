import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FindOrdersInputSchema, FindOrdersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolOk } from "../tool-result.ts";

export function registerFindOrders(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.findOrders,
    {
      title: "Tìm đơn hàng",
      description:
        "Đếm đơn khớp bộ lọc (khách, sản phẩm, trạng thái, khoảng tháng), trả tổng tiền và vài đơn mẫu mới nhất. " +
        "Doanh thu theo nhóm thì dùng nexus_revenue_by.",
      inputSchema: FindOrdersInputSchema.shape,
      outputSchema: FindOrdersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ sample, ...filter }) => toolOk(await deps.orders.find(filter, sample)),
  );
}
