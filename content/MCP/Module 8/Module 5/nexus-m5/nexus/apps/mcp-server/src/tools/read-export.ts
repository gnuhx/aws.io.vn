import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EXPORT_TEXT_TYPES, ReadExportInputSchema, ReadExportOutputSchema, TOOL } from "@nexus/shared";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { readHead, resolveExisting } from "../files/safe-path.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const mimeOf = (p: string): string | undefined => (EXPORT_TEXT_TYPES as Record<string, string>)[path.extname(p).toLowerCase()];

export function registerReadExport(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.readExport,
    {
      title: "Đọc file export",
      description:
        "Đọc phần đầu 1 file văn bản (.csv, .md, .txt, .json) trong thư mục export. path lấy từ nexus_list_exports. " +
        "File dài bị cắt ở maxBytes (truncated=true). Cần con số từ CSV (đếm, tổng theo cột) thì dùng nexus_analyze_export, đừng đọc thô.",
      inputSchema: ReadExportInputSchema.shape,
      outputSchema: ReadExportOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.readExport, deps.log, async ({ path: userPath, maxBytes }) => {
      const r = await resolveExisting(deps.exportsDir, userPath);
      if (!r.ok) {
        if (r.reason === "outside") {
          // Sự kiện bảo mật: log chi tiết ra stderr, model chỉ nhận câu chung
          deps.log.warn("export path denied", { path: userPath, detail: r.detail });
          return toolFail({ what: `Không đọc được "${userPath}": đường dẫn nằm ngoài thư mục export.`, next: "Chỉ dùng path do nexus_list_exports trả về." });
        }
        return toolFail({ what: `Không có file "${userPath}" trong thư mục export.`, next: "Gọi nexus_list_exports để xem các file hiện có." });
      }
      const mimeType = mimeOf(r.rel);
      if (!mimeType) {
        return toolFail({ what: `"${userPath}" không phải file văn bản (.csv, .md, .txt, .json).`, next: "Báo người dùng tải file này về để xem." });
      }
      const head = await readHead(r.path, maxBytes);
      return toolOk(ReadExportOutputSchema, { path: r.rel.split(path.sep).join("/"), mimeType, ...head });
    }),
  );
}
