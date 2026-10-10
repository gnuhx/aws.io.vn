import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CITIES, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { barChartPng } from "../png.ts";
import { toolFail } from "../tool-result.ts";

const MAX_IMAGE_BASE64 = 1_000_000;
const ChartOutputSchema = z.object({ counts: z.record(z.string(), z.number().int()), order: z.array(z.string()) });

export function registerChartCustomersByCity(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.chartCustomersByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description:
        "Vẽ biểu đồ cột (PNG) số khách theo thành phố, kèm số liệu. Chỉ gọi khi người dùng muốn XEM biểu đồ; " +
        `để trả lời bằng số, dùng ${TOOL.listCustomers}.`,
      outputSchema: ChartOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.chartCustomersByCity, deps.log, async () => {
      const counts = await deps.customers.countByCity();
      const png = barChartPng(CITIES.map((c) => counts[c]));
      const data = png.toString("base64"); // base64 THUẦN — không có tiền tố data:
      if (data.length > MAX_IMAGE_BASE64) {
        return toolFail({ what: "Ảnh biểu đồ quá lớn để gửi.", next: `Dùng ${TOOL.listCustomers} để trả lời bằng số.` });
      }
      const structured = { counts, order: [...CITIES] };
      return {
        structuredContent: structured,
        content: [
          { type: "text", text: JSON.stringify(structured) },
          { type: "image", data, mimeType: "image/png" },
        ],
      };
    }),
  );
}
