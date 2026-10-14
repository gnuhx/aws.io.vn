import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TIERS, TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { progressReporter, type Extra } from "../progress.ts";
import { toolOk } from "../tool-result.ts";

const Out = z.object({
  total: z.number().int(),
  byCity: z.record(z.string(), z.number().int()),
  byTier: z.record(z.string(), z.number().int()),
});

export function registerGenerateReport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng",
      description: "Báo cáo tổng hợp khách theo thành phố và gói. Chạy vài giây, có báo tiến độ. Gọi cho câu hỏi tổng quan, không cho 1 khách.",
      outputSchema: Out.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (extra: Extra) => {
      const report = progressReporter(extra, 3);
      await report(1, "Đếm theo thành phố");
      const byCity = await deps.customers.countByCity();
      await report(2, "Đếm theo gói");
      const page = await deps.customers.list({ limit: 10_000 });
      const byTier = Object.fromEntries(TIERS.map((t) => [t, page.items.filter((c) => c.tier === t).length]));
      await report(3, "Xong");
      return toolOk(Out, { total: CITIES.reduce((s, c) => s + byCity[c], 0), byCity, byTier });
    }),
  );
}
