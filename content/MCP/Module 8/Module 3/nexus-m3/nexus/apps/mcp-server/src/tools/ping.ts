import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL } from "@nexus/shared";
import { z } from "zod";
import { toolOk } from "../tool-result.ts";

const PingOutput = z.object({ ok: z.literal(true), server: z.string() });

export function registerPing(server: McpServer, deps: { version: string }): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Ping",
      description: "Kiểm tra server Nexus còn sống. Chỉ dùng khi người dùng hỏi hệ thống có hoạt động không.",
      outputSchema: PingOutput.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => toolOk(PingOutput, { ok: true, server: `nexus ${deps.version}` }),
  );
}
