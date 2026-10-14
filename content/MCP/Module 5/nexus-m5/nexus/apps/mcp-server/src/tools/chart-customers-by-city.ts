import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { barChartPng } from "../png.ts";

export function registerChartCustomersByCity(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.chartCustomersByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description: "Ảnh PNG biểu đồ cột số khách theo thành phố, kèm số liệu dạng text. Chỉ gọi khi người dùng muốn XEM biểu đồ.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.chartCustomersByCity, deps.log, async () => {
      const counts = await deps.customers.countByCity();
      const values = CITIES.map((c) => counts[c]);
      return {
        content: [
          { type: "text", text: CITIES.map((c) => `${c}: ${counts[c]}`).join(" · ") },
          { type: "image", mimeType: "image/png", data: barChartPng(values).toString("base64") },
        ],
      };
    }),
  );
}
