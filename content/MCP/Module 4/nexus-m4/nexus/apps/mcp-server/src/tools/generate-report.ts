import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CITIES, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { progressReporter, type Extra } from "../progress.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const STEP_MS = 400;
const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

const ReportOutputSchema = z.object({
  generatedAt: z.string(),
  totalCustomers: z.number().int(),
  byCity: z.array(z.object({ city: z.string(), customers: z.number().int() })),
});

export function registerGenerateReport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.generateReport,
    {
      title: "Báo cáo khách hàng theo thành phố",
      description:
        "Tạo báo cáo tổng hợp số khách theo từng thành phố (chạy ~2 giây, có báo tiến độ). " +
        `Gọi khi người dùng cần báo cáo tổng hợp; câu hỏi đếm đơn giản thì dùng ${TOOL.listCustomers}.`,
      outputSchema: ReportOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.generateReport, deps.log, async (extra: Extra) => {
      const report = progressReporter(extra);
      const n = CITIES.length;
      await report(0, n, "Bắt đầu");
      const counts = await deps.customers.countByCity();
      const byCity: { city: string; customers: number }[] = [];
      for (const [i, city] of CITIES.entries()) {
        await sleep(STEP_MS, extra.signal); // giả lập truy vấn nặng theo từng thành phố
        if (extra.signal.aborted) {
          return toolFail({ what: "Báo cáo đã bị hủy giữa chừng.", next: "Không cần làm gì thêm." });
        }
        byCity.push({ city, customers: counts[city] });
        await report(i + 1, n, city);
      }
      const totalCustomers = byCity.reduce((s, r) => s + r.customers, 0);
      return toolOk(ReportOutputSchema, { generatedAt: deps.now().toISOString(), totalCustomers, byCity });
    }),
  );
}
