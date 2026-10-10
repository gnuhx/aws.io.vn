// "Dịch thẳng từ C#" — S7.5: override handler tools/list của SDK để chèn field spec mới. ĐỪNG viết thế này.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export function createServerWithCache(): McpServer {
  const server = new McpServer({ name: "nexus", version: "1" }, { capabilities: { tools: {} } });
  // Viết lại tools/list bằng tay: phải tự dựng lại JSON Schema, annotations, outputSchema mà McpServer vẫn làm hộ.
  // Và McpServer đăng ký handler của nó khi registerTool lần đầu → gọi registerTool SAU dòng này là ghi đè mất bản tay.
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{ name: "nexus_list_tasks", inputSchema: { type: "object" } }],
    ttlMs: 300_000,
    cacheScope: "public",
  }));
  return server;
}
