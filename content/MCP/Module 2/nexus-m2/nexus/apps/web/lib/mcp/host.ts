import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { serverEnv } from "../env.server.ts";
import type { LlmTool, ToolResult } from "../llm/types.ts";

/**
 * 1 kết nối MCP (1 process con) cho cả web process.
 * Để trên globalThis vì `next dev` nạp lại module khi sửa code: biến module-level sẽ bị tạo lại
 * → mỗi lần lưu file lại spawn thêm 1 server con.
 */
interface McpHost {
  client: Client;
  tools: LlmTool[];
}
const g = globalThis as typeof globalThis & { __nexusMcp?: Promise<McpHost> };

async function connect(): Promise<McpHost> {
  const env = serverEnv();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [env.MCP_SERVER_ENTRY],
    // Chỉ chuyển đúng biến server cần. KHÔNG chuyển ANTHROPIC_API_KEY sang process con.
    env: {
      ...getDefaultEnvironment(),
      NEXUS_DATA: env.NEXUS_DATA,
      ...(env.MONGODB_URI !== undefined && { MONGODB_URI: env.MONGODB_URI }),
    },
    stderr: "inherit",
  });
  const client = new Client({ name: "nexus-web", version: "0.1.0" });
  transport.onclose = () => { g.__nexusMcp = undefined; }; // server con chết → lần sau kết nối lại
  await client.connect(transport);
  const { tools } = await client.listTools();
  return {
    client,
    tools: tools.map((t) => ({ name: t.name, description: t.description ?? "", inputSchema: t.inputSchema })),
  };
}

export function mcpHost(): Promise<McpHost> {
  g.__nexusMcp ??= connect().catch((err: unknown) => {
    g.__nexusMcp = undefined; // đừng cache lời hứa đã hỏng
    throw err;
  });
  return g.__nexusMcp;
}

export async function callMcpTool(name: string, input: Record<string, unknown>, callId: string): Promise<ToolResult> {
  const { client } = await mcpHost();
  const r = (await client.callTool({ name, arguments: input })) as CallToolResult;
  const text = r.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n");
  return { callId, content: text, isError: r.isError === true };
}
