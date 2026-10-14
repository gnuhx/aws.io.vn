import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListExportsOutputSchema, TOOL } from "@nexus/shared";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

const MAX_LISTED = 100;

export function registerListExports(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listExports,
    {
      title: "Danh sách file export",
      description:
        "Liệt kê file trong thư mục export của Nexus (CSV, báo cáo…). Gọi trước nexus_read_export để lấy đúng path. " +
        "Chỉ liệt kê file thường; tối đa 100 file mới nhất.",
      outputSchema: ListExportsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listExports, deps.log, async () => {
      const entries = await readdir(deps.exportsDir, { recursive: true, withFileTypes: true });
      // Dirent.isFile() là false với symlink → symlink không bao giờ được liệt kê
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile())
          .map(async (e) => {
            const abs = path.join(e.parentPath, e.name);
            const s = await stat(abs);
            return { path: path.relative(deps.exportsDir, abs).split(path.sep).join("/"), bytes: s.size, modified: s.mtime.toISOString() };
          }),
      );
      files.sort((a, b) => b.modified.localeCompare(a.modified) || a.path.localeCompare(b.path));
      const items = files.slice(0, MAX_LISTED);
      return toolOk(ListExportsOutputSchema, { total: files.length, returned: items.length, items });
    }),
  );
}
