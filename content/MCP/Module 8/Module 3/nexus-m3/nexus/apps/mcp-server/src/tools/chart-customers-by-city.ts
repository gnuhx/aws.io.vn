import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TOOL } from "@nexus/shared";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { barChartPng, type Rgb } from "../png.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ChartDeps {
  customers: CustomerRepository;
  log: Logger;
}

/** Trần kích thước ảnh sau base64 — ảnh lớn ăn context của model và có client từ chối. */
export const MAX_IMAGE_BASE64 = 1_000_000;

const PALETTE: readonly Rgb[] = [[184, 88, 58], [95, 109, 51], [156, 124, 20], [107, 74, 51], [163, 58, 42]];

const ChartOutput = z.object({
  counts: z.array(z.object({ city: z.string(), count: z.number().int() })).describe("Số khách mỗi thành phố, cùng thứ tự các cột trong ảnh"),
  total: z.number().int(),
  image: z.object({ mimeType: z.literal("image/png"), bytes: z.number().int(), width: z.number().int(), height: z.number().int() }),
});

export function registerChartCustomersByCity(server: McpServer, deps: ChartDeps): void {
  server.registerTool(
    TOOL.chartCustomersByCity,
    {
      title: "Biểu đồ khách theo thành phố",
      description:
        "Vẽ biểu đồ cột (ảnh PNG) số khách hàng theo từng thành phố, kèm số liệu dạng JSON. " +
        "Chỉ gọi khi người dùng muốn XEM biểu đồ; để trả lời bằng số, dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ChartOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.chartCustomersByCity, deps.log, async () => {
      const counts = await Promise.all(CITIES.map(async (city) => ({ city, count: (await deps.customers.list({ city, limit: 1 })).total })));
      const width = 480, height = 240;
      const png = barChartPng(counts.map((c) => c.count), { width, height, colors: PALETTE });
      const data = png.toString("base64");
      if (data.length > MAX_IMAGE_BASE64) {
        return toolFail({ what: `Ảnh biểu đồ quá lớn (${data.length} ký tự base64).`, next: "Trả lời bằng số liệu từ nexus_list_customers thay vì ảnh." });
      }
      return toolOk(
        ChartOutput,
        { counts, total: counts.reduce((s, c) => s + c.count, 0), image: { mimeType: "image/png", bytes: png.length, width, height } },
        [{ type: "image", data, mimeType: "image/png" }],
      );
    }),
  );
}
