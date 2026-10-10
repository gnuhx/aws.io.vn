import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, TIERS, TOOL, type Tier } from "@nexus/shared";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { progressReporter } from "../progress.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ReportDeps {
  customers: CustomerRepository;
  log: Logger;
  now: () => Date;
  /** Thời gian mỗi bước. Mô phỏng việc nặng theo từng thành phố (M5 thay bằng aggregation thật). */
  stepMs: number;
}

const Row = z.object({ city: z.string(), total: z.number().int(), free: z.number().int(), pro: z.number().int(), enterprise: z.number().int() });
const ReportOutput = z.object({
  generatedAt: z.string(),
  totalCustomers: z.number().int(),
  rows: z.array(Row).describe("1 dòng / thành phố: tổng và số khách theo từng gói"),
});

export function registerGenerateReport(server: McpServer, deps: ReportDeps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng theo thành phố",
      description:
        "Tạo báo cáo tổng hợp số khách theo thành phố và theo gói (free/pro/enterprise). Chạy vài giây, có báo tiến độ. " +
        "Gọi khi người dùng muốn báo cáo/tổng quan; câu hỏi đếm đơn lẻ thì dùng nexus_list_customers.",
      inputSchema: {},
      outputSchema: ReportOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (_args, extra) => {
      const report = progressReporter(extra);
      const rows: z.infer<typeof Row>[] = [];
      for (const [i, city] of CITIES.entries()) {
        if (extra.signal.aborted) {
          deps.log.info("report cancelled", { done: i, of: CITIES.length });
          return toolFail({ what: `Báo cáo bị hủy sau ${i}/${CITIES.length} thành phố.`, next: "Không cần làm gì thêm." });
        }
        await report(i, CITIES.length, `Đang tổng hợp ${city}`);
        const { total, items } = await deps.customers.list({ city, limit: 50 });
        const byTier = Object.fromEntries(TIERS.map((t) => [t, items.filter((c) => c.tier === t).length])) as Record<Tier, number>;
        rows.push({ city, total, ...byTier });
        deps.log.debug("report step", { city, total });
        await sleep(deps.stepMs, undefined, { signal: extra.signal }).catch(() => {});
      }
      await report(CITIES.length, CITIES.length, "Xong");
      return toolOk(ReportOutput, {
        generatedAt: deps.now().toISOString(),
        totalCustomers: rows.reduce((s, r) => s + r.total, 0),
        rows,
      });
    }),
  );
}
