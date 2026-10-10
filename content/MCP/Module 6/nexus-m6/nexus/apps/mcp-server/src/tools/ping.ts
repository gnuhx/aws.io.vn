import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import type { Deps } from "../deps.ts";
import { toolOk } from "../tool-result.ts";

export function registerPing(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Kiểm tra kết nối",
      description: "Kiểm tra server Nexus còn sống. Chỉ gọi khi cần chẩn đoán kết nối.",
      outputSchema: { pong: z.literal(true), at: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async () => toolOk({ pong: true as const, at: deps.now().toISOString() }),
  );
}
