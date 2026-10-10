import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

const GetTimeInputSchema = z.object({
  timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh'"),
});
const GetTimeOutputSchema = z.object({ timeZone: z.string(), iso: z.string(), local: z.string() });

export function registerGetTime(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Trả giờ hiện tại theo múi giờ IANA. Gọi khi người dùng hỏi mấy giờ, hôm nay ngày mấy, hoặc cần mốc thời gian để tính 'tuần này'.",
      inputSchema: GetTimeInputSchema.shape,
      outputSchema: GetTimeOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      const now = deps.now();
      let local: string;
      try {
        local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      } catch {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh'.",
        });
      }
      return toolOk(GetTimeOutputSchema, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
