import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, RESOURCE } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { barChartPng } from "../png.ts";

export function registerCharts(server: McpServer, deps: Deps): void {
  server.registerResource(
    "chart-customers-by-city",
    RESOURCE.chartByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description: "Ảnh PNG số khách theo thành phố — dành cho người xem.",
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
