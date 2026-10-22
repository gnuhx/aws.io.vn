/** Server tí hon cho các bẫy S8.1 — 1 tool, dữ liệu RAM. Không thuộc Nexus. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function makeTiny(): { server: McpServer; tasks: string[] } {
  const tasks = ["Gọi khách cus_001", "Gửi báo giá"];
  const server = new McpServer({ name: "tiny", version: "1.0.0" });
  server.registerTool(
    "add_task",
    { description: "Thêm việc", inputSchema: { title: z.string().min(3) }, outputSchema: { count: z.number() } },
    async ({ title }) => {
      tasks.push(title);
      return { content: [{ type: "text", text: `${tasks.length}` }], structuredContent: { count: tasks.length } };
    },
  );
  server.registerTool("count_tasks", { description: "Đếm việc", outputSchema: { count: z.number() } }, async () => ({
    content: [{ type: "text", text: `${tasks.length}` }],
    structuredContent: { count: tasks.length },
  }));
  return { server, tasks };
}

export async function connectTiny(server: McpServer): Promise<Client> {
  const client = new Client({ name: "trap", version: "1.0.0" });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);
  await client.connect(ct);
  return client;
}
