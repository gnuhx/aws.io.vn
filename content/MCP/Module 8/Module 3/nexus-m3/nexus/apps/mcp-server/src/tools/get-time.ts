import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetTimeDeps {
  now: () => Date;
  log: Logger;
}

const GetTimeOutput = z.object({
  timeZone: z.string(),
  iso: z.string().describe("Thời điểm UTC, ISO 8601"),
  local: z.string().describe("Giờ địa phương, định dạng tiếng Việt"),
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại",
      description:
        "Lấy ngày giờ hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'hôm nay', 'bây giờ', 'tuần này' — " +
        "model không tự biết ngày hiện tại.",
      inputSchema: {
        timeZone: z.string().default("Asia/Ho_Chi_Minh").describe("Tên múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/Berlin'."),
      },
      outputSchema: GetTimeOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getTime, deps.log, async ({ timeZone }) => {
      if (!isValidTimeZone(timeZone)) {
        return toolFail({
          what: `Múi giờ '${timeZone}' không có trong cơ sở dữ liệu IANA.`,
          next: "Gọi lại với tên dạng Khu_vực/Thành_phố, ví dụ 'Asia/Ho_Chi_Minh' cho Việt Nam.",
        });
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", { timeZone, dateStyle: "full", timeStyle: "medium" }).format(now);
      return toolOk(GetTimeOutput, { timeZone, iso: now.toISOString(), local });
    }),
  );
}
