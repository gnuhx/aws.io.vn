import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const In = z.object({
  timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Múi giờ IANA, ví dụ Asia/Ho_Chi_Minh, Europe/Berlin"),
});
const Out = z.object({ timeZone: z.string(), iso: z.string(), local: z.string() });

export function registerGetTime(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description: "Giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc ngày/giờ hôm nay (\"tuần này\", \"hôm qua\").",
      inputSchema: In.shape,
      outputSchema: Out.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      const now = new Date();
      try {
        const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
        return toolOk(Out, { timeZone, iso: now.toISOString(), local });
      } catch {
        return toolFail({ what: `Múi giờ "${timeZone}" không hợp lệ.`, next: "Dùng tên IANA dạng Khu_vực/Thành_phố, ví dụ Asia/Ho_Chi_Minh." });
      }
    }),
  );
}
