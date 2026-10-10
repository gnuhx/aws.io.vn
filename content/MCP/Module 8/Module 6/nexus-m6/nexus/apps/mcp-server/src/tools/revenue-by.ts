import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RevenueByInputSchema, RevenueByOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerRevenueBy(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.revenueBy,
    {
      title: "Doanh thu theo nhóm",
      description:
        "Doanh thu (chỉ đơn paid) nhóm theo tháng giờ VN / thành phố / sản phẩm, đã cộng sẵn — đừng tự cộng từ danh sách đơn. " +
        "Cần số của 1 khách thì dùng nexus_find_orders.",
      inputSchema: RevenueByInputSchema.shape,
      outputSchema: RevenueByOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ by, from, to, top }) => {
      if (from && to && from > to) return toolFail(`from (${from}) đứng sau to (${to}). Đổi chỗ 2 tháng rồi gọi lại.`);
      const rows = await deps.orders.revenueBy(by, { from, to });
      const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
      return toolOk({ by, totalRevenue, rows: rows.slice(0, top), omitted: Math.max(0, rows.length - top) });
    },
  );
}
