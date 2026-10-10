import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPing(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Kiểm tra server Nexus còn sống. Gọi khi người dùng hỏi server có hoạt động không.",
    },
    async () => ({ content: [{ type: "text", text: "pong" }] }),
  );
}
