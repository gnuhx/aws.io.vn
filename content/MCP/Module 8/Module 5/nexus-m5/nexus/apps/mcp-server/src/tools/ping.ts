import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

const Out = z.object({ pong: z.literal(true), at: z.string() });

export function registerPing(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Kiểm tra kết nối",
      description: "Kiểm tra MCP server Nexus còn sống. Chỉ gọi khi người dùng hỏi về kết nối; không dùng để lấy dữ liệu.",
      outputSchema: Out.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.ping, deps.log, async () => toolOk(Out, { pong: true, at: new Date().toISOString() })),
  );
}
