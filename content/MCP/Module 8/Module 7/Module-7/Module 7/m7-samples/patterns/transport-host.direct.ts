// "Dịch thẳng từ C#" — S7.1: AddSingleton<McpServer> + 1 lớp host cho mỗi transport. ĐỪNG viết thế này.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export abstract class McpHostBase {
  protected static readonly server = new McpServer({ name: "nexus", version: "1" }); // singleton cho cả process
  abstract startAsync(): Promise<void>;
}

export class StdioHost extends McpHostBase {
  async startAsync() {
    McpHostBase.server.registerTool("nexus_list_tasks", { inputSchema: { owner: z.string().optional() } }, async () => ({ content: [] }));
    await McpHostBase.server.connect(new StdioServerTransport());
  }
}

export class HttpHost extends McpHostBase {
  async startAsync() {
    // đăng ký lại cùng tool (copy) — và lần connect thứ 2 sẽ ném "Already connected to a transport"
    McpHostBase.server.registerTool("nexus_list_tasks_http", { inputSchema: { owner: z.string().optional() } }, async () => ({ content: [] }));
    await McpHostBase.server.connect(new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() }));
  }
}
