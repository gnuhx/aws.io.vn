import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface GetTimeDeps {
  now: () => Date;
}

function isTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function registerGetTime(server: McpServer, deps: GetTimeDeps): void {
  server.registerTool(
    "get_time",
    {
      title: "Giờ hiện tại",
      description:
        "Trả thời điểm hiện tại theo múi giờ IANA. Gọi khi câu hỏi phụ thuộc 'bây giờ', 'hôm nay', 'tuần này'.",
      inputSchema: {
        timeZone: z
          .string()
          .default("Asia/Ho_Chi_Minh")
          .describe("Múi giờ IANA, ví dụ 'Asia/Ho_Chi_Minh', 'Europe/London'."),
      },
    },
    async ({ timeZone }) => {
      if (!isTimeZone(timeZone)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Múi giờ '${timeZone}' không hợp lệ. Dùng tên IANA như 'Asia/Ho_Chi_Minh'.` }],
        };
      }
      const now = deps.now();
      const local = new Intl.DateTimeFormat("vi-VN", {
        timeZone, dateStyle: "full", timeStyle: "medium",
      }).format(now);
      return { content: [{ type: "text", text: `${now.toISOString()} — ${timeZone}: ${local}` }] };
    },
  );
}
