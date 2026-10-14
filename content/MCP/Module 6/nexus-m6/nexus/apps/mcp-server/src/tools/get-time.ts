import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Deps } from "../deps.ts";
import { toolOk } from "../tool-result.ts";

export function registerGetTime(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getTime,
    {
      title: "Giờ hiện tại (Việt Nam)",
      description: "Trả ngày giờ hiện tại theo giờ Việt Nam. Gọi trước khi tính 'tuần này', 'tháng trước', 'quá hạn'.",
      outputSchema: { iso: z.string(), vn: z.string(), today: z.string() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const now = deps.now();
      const vn = new Date(now.getTime() + 7 * 3600_000).toISOString();
      return toolOk({ iso: now.toISOString(), vn: `${vn.slice(0, 19)}+07:00`, today: vn.slice(0, 10) });
    },
  );
}
