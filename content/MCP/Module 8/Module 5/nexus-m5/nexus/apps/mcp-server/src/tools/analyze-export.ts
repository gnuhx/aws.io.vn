import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AnalyzeExportInputSchema, AnalyzeExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import { parseCsv, parseNumber } from "../csv/parse.ts";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const MAX_CSV_BYTES = 5_000_000;

export function registerAnalyzeExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.analyzeExport,
    {
      title: "Phân tích file CSV",
      description:
        "Đếm / cộng 1 file CSV trong thư mục export theo 1 cột (group by), có thể lọc 1 cột bằng 1 giá trị. " +
        "Trả bảng tổng hợp, KHÔNG trả dòng dữ liệu thô. Dùng thay cho nexus_read_export khi cần con số từ CSV.",
      inputSchema: AnalyzeExportInputSchema.shape,
      outputSchema: AnalyzeExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.analyzeExport, deps.log, async ({ path: userPath, groupBy, sum, where, top }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") deps.log.warn("export path denied", { path: userPath, detail: r.detail });
        return toolFail({ what: `Không đọc được "${userPath}".`, next: "Chỉ dùng path do nexus_list_exports trả về." });
      }
      if (path.extname(r.rel).toLowerCase() !== ".csv") return toolFail({ what: `"${userPath}" không phải .csv.`, next: "Chọn 1 file .csv từ nexus_list_exports." });
      const head = await readHead(r.path, MAX_CSV_BYTES);
      if (head.truncated) return toolFail({ what: `File lớn hơn ${MAX_CSV_BYTES / 1e6} MB.`, next: "Báo người dùng tách file hoặc nhập vào hệ thống." });
      const csv = parseCsv(head.text);
      const col = (name: string): number => csv.header.indexOf(name);
      const missing = [groupBy, ...(sum ? [sum] : []), ...(where ? [where.column] : [])].filter((c) => col(c) < 0);
      if (missing.length > 0) return toolFail({ what: `Không có cột: ${missing.join(", ")}.`, next: `Cột có trong file: ${csv.header.join(", ")}.` });

      const gi = col(groupBy);
      const si = sum ? col(sum) : -1;
      const wi = where ? col(where.column) : -1;
      const groups = new Map<string, { key: string; rows: number; sum: number }>();
      let matchedRows = 0;
      let skippedRows = 0;
      for (const row of csv.rows) {
        if (where && (row[wi] ?? "") !== where.equals) continue;
        matchedRows++;
        const key = row[gi] ?? "";
        const g = groups.get(key) ?? { key, rows: 0, sum: 0 };
        g.rows++;
        if (si >= 0) {
          const n = parseNumber(row[si] ?? "");
          if (n === undefined) skippedRows++;
          else g.sum += n;
        }
        groups.set(key, g);
      }
      const sorted = [...groups.values()].sort((a, b) => (si >= 0 ? b.sum - a.sum : b.rows - a.rows));
      const kept = sorted.slice(0, top).map((g) => (si >= 0 ? g : { key: g.key, rows: g.rows }));
      return toolOk(AnalyzeExportOutputSchema, {
        path: r.rel,
        columns: csv.header,
        rowCount: csv.rows.length,
        matchedRows,
        skippedRows,
        groups: kept,
        omitted: sorted.length - kept.length,
      });
    }),
  );
}
