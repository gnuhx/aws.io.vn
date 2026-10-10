import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, RESOURCE } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { barChartPng } from "../png.ts";

/**
 * Resource NHỊ PHÂN: `blob` (base64 thuần) + mimeType đúng định dạng byte.
 * Cùng dữ liệu với tool nexus_chart_customers_by_city — khác người chọn: ở đây ứng dụng/người dùng chọn đưa vào.
 */
export function registerChartResources(server: McpServer, deps: Deps): void {
  server.registerResource(
    "customers-by-city-chart",
    RESOURCE.customersByCityChart,
    {
      title: "Biểu đồ khách theo thành phố",
      description: `Ảnh PNG 480×240, cột theo thứ tự: ${CITIES.join(", ")}. Luôn phản ánh dữ liệu hiện tại.`,
      mimeType: "image/png",
      annotations: { audience: ["user"], priority: 0.3 },
    },
    async (uri) => {
      const counts = await deps.customers.countByCity();
      const png = barChartPng(CITIES.map((c) => counts[c]));
      return { contents: [{ uri: uri.href, mimeType: "image/png", blob: png.toString("base64") }] };
    },
  );
}
