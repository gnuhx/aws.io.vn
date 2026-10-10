import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RevenueByInputSchema, RevenueByOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerRevenueBy(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.revenueBy,
    {
      title: "Doanh thu theo nhóm",
      description:
        "Tổng doanh thu (đơn đã thu tiền) theo tháng, thành phố hoặc sản phẩm — số đã cộng sẵn trong DB. " +
        "Dùng cho mọi câu hỏi \"doanh thu bao nhiêu / tháng nào cao nhất / khu vực nào\". " +
        "Đừng tự cộng từ nexus_find_orders hay nexus_query. Tháng tính theo giờ Việt Nam.",
      inputSchema: RevenueByInputSchema.shape,
      outputSchema: RevenueByOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.revenueBy, deps.log, async ({ by, from, to, top }) => {
      if (from !== undefined && to !== undefined && from > to) {
        return toolFail({ what: `Khoảng tháng ngược: from ${from} > to ${to}.`, next: "Đổi chỗ from và to." });
      }
      const groups = await deps.orders.revenueBy(by, { from, to });
      const totalRevenue = groups.reduce((s, g) => s + g.revenue, 0);
      const totalOrders = groups.reduce((s, g) => s + g.orders, 0);
      const ordered = by === "month" ? groups.sort((a, b) => a.key.localeCompare(b.key)).slice(-top) : groups.sort((a, b) => b.revenue - a.revenue).slice(0, top);
      const rows = ordered.map((g) => ({ ...g, share: totalRevenue === 0 ? 0 : Math.round((g.revenue / totalRevenue) * 1000) / 1000 }));
      return toolOk(RevenueByOutputSchema, {
        by,
        from: from ?? "*",
        to: to ?? "*",
        currency: "VND",
        totalRevenue,
        totalOrders,
        rows,
        omitted: groups.length - rows.length,
      });
    }),
  );
}
