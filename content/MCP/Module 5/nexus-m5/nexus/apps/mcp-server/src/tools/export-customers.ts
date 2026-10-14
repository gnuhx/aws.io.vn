import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExportCustomersInputSchema, ExportCustomersOutputSchema, TOOL, type Customer } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resolveNew, writeFileSafe } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const COLS = ["id", "name", "email", "city", "tier", "createdAt"] as const satisfies ReadonlyArray<keyof Customer>;

/** RFC 4180 + chặn CSV injection: ô bắt đầu bằng = + - @ bị Excel coi là công thức. */
export function csvCell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function registerExportCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.exportCustomers,
    {
      title: "Xuất khách hàng ra CSV",
      description:
        "Ghi danh sách khách (có thể lọc theo thành phố) ra 1 file .csv mới trong thư mục export. " +
        "Không ghi đè file đã có trừ khi overwrite=true. Gọi khi người dùng muốn TẢI danh sách, không dùng để trả lời câu hỏi.",
      inputSchema: ExportCustomersInputSchema.shape,
      outputSchema: ExportCustomersOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.exportCustomers, deps.log, async ({ filename, city, overwrite }) => {
      const target = await resolveNew(deps.exportsDir, filename);
      if (!target.ok) {
        deps.log.warn("export write denied", { filename, detail: target.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Dùng tên file đơn giản như khach-ha-noi.csv." });
      }
      const page = await deps.customers.list({ city, limit: 100_000 });
      const lines = [COLS.join(","), ...page.items.map((c) => COLS.map((k) => csvCell(String(c[k]))).join(","))];
      const w = await writeFileSafe(target.path, `${lines.join("\r\n")}\r\n`, overwrite);
      if (!w.ok) {
        if (w.reason === "exists") return toolFail({ what: `File "${filename}" đã có.`, next: "Chọn tên khác, hoặc hỏi người dùng có muốn ghi đè (overwrite=true) không." });
        deps.log.warn("export write denied", { filename, detail: w.detail });
        return toolFail({ what: `Không ghi được "${filename}".`, next: "Chọn tên file khác." });
      }
      return toolOk(ExportCustomersOutputSchema, { path: target.rel, rows: page.items.length, bytes: w.bytes });
    }),
  );
}
