import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExportTasksInputSchema, ExportTasksOutputSchema, TOOL, type Task, type TaskFilter } from "@nexus/shared";
import path from "node:path";
import type { Deps } from "../deps.ts";
import { openRoot, resolveNew, writeFileSafe } from "../files/safe-path.ts";
import type { RootsTracker } from "../roots/workspace.ts";
import type { TaskKey } from "../tasks/repository.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const SUBDIR = "nexus-exports";
const COLS = ["id", "title", "status", "assignee", "customerId", "dueDate", "createdAt"] as const;

/** Ô CSV an toàn: bọc ngoặc khi cần, chặn CSV injection (=, +, -, @ đầu ô) — M5 · S5.1. */
const csvCell = (v: string | null): string => {
  const s = v ?? "";
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

async function allTasks(deps: Deps, filter: TaskFilter): Promise<Task[]> {
  const out: Task[] = [];
  let after: TaskKey | undefined;
  for (;;) {
    const page = await deps.tasks.page(filter, after, 500);
    out.push(...page.items);
    const last = page.items.at(-1);
    if (!page.hasMore || !last) return out;
    after = last;
  }
}

export function registerExportTasks(server: McpServer, deps: Deps, roots: RootsTracker): void {
  server.registerTool(
    TOOL.exportTasks,
    {
      title: "Xuất việc ra CSV",
      description:
        "Ghi danh sách việc (lọc theo trạng thái/người) ra file CSV trong thư mục làm việc của người dùng " +
        `(root đầu tiên client khai báo, thư mục con ${SUBDIR}/). Client không khai roots thì ghi vào thư mục export của server.`,
      inputSchema: ExportTasksInputSchema.shape,
      outputSchema: ExportTasksOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ filename, overwrite, ...filter }) => {
      const view = await roots.current();
      let base: string;
      let rootName: string;
      let location: "client_root" | "server_dir";
      if (view.kind === "client") {
        const first = view.roots[0];
        if (!first) return toolFail("Client khai báo roots nhưng không có thư mục nào dùng được trên máy này. Nhờ người dùng mở 1 thư mục làm việc.");
        base = await openRoot(path.join(first.dir, SUBDIR));
        rootName = first.name;
        location = "client_root";
      } else {
        base = await openRoot(deps.exportsDir);
        rootName = "thư mục export của server";
        location = "server_dir";
      }

      const target = await resolveNew(base, filename);
      if (!target.ok) return toolFail("Tên file nằm ngoài thư mục được phép.");
      const rows = await allTasks(deps, filter);
      const csv = [COLS.join(","), ...rows.map((t) => COLS.map((c) => csvCell(t[c])).join(","))].join("\r\n") + "\r\n";
      const w = await writeFileSafe(target.path, csv, overwrite);
      if (!w.ok) {
        return toolFail(w.reason === "exists" ? `File ${filename} đã có. Đặt tên khác, hoặc overwrite=true nếu người dùng muốn ghi đè.` : "Không ghi được (đích là symlink).");
      }
      const rel = location === "client_root" ? path.join(SUBDIR, target.rel) : target.rel;
      return toolOk({
        written: true,
        location,
        root: rootName,
        path: rel,
        rows: rows.length,
        bytes: w.bytes,
        note: view.kind === "client" ? `roots: ${view.roots.length} thư mục, lấy ${view.fetched === "cache" ? "từ cache" : "mới từ client"}` : "client không hỗ trợ roots",
      });
    },
  );
}
