import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FindOrdersInputSchema, FindOrdersOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export function registerFindOrders(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.findOrders,
    {
      title: "Lọc đơn hàng",
      description:
        "Lọc đơn hàng theo khách, sản phẩm, thành phố, trạng thái, số tiền, khoảng tháng. Trả SỐ ĐẾM + TỔNG TIỀN + vài đơn mẫu mới nhất, " +
        "không trả toàn bộ danh sách. Doanh thu theo nhóm thì dùng nexus_revenue_by.",
      inputSchema: FindOrdersInputSchema.shape,
      outputSchema: FindOrdersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.findOrders, deps.log, async ({ sample, ...filter }) => {
      const r = await deps.orders.find(filter, sample);
      return toolOk(FindOrdersOutputSchema, {
        matched: r.matched,
        totalAmount: r.totalAmount,
        sample: r.sample.map(({ id, customerId, product, amount, status, createdAt }) => ({ id, customerId, product, amount, status, createdAt })),
      });
    }),
  );
}
