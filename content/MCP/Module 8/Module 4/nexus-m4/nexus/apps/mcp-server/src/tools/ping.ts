import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

const PingOutputSchema = z.object({ reply: z.literal("pong"), at: z.string() });

export function registerPing(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.ping,
    {
      title: "Kiểm tra kết nối",
      description: "Trả 'pong' kèm giờ server. Chỉ gọi khi cần kiểm tra server Nexus còn sống; không dùng cho câu hỏi nghiệp vụ.",
      outputSchema: PingOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.ping, deps.log, async () => toolOk(PingOutputSchema, { reply: "pong", at: deps.now().toISOString() })),
  );
}
