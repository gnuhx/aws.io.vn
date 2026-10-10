import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { serverEnv } from "../env.server.ts";
import type { ToolSpec } from "../llm/types.ts";

interface McpHost {
  client: Client;
  tools: ToolSpec[];
}

/** Singleton trên globalThis: next dev nạp lại module khi sửa file — biến module sẽ spawn thêm process con. */
const g = globalThis as typeof globalThis & { __nexusMcp?: Promise<McpHost> };

async function connect(): Promise<McpHost> {
  const env = serverEnv();
  // Least privilege: process con chỉ nhận đúng biến nó cần, KHÔNG có ANTHROPIC_API_KEY
  const childEnv: Record<string, string> = { PATH: process.env["PATH"] ?? "", NEXUS_DATA: env.NEXUS_DATA };
  if (env.MONGODB_URI) childEnv["MONGODB_URI"] = env.MONGODB_URI;
  const transport = new StdioClientTransport({ command: process.execPath, args: [env.MCP_SERVER_ENTRY], env: childEnv, stderr: "inherit" });
  const client = new Client({ name: "nexus-web", version: "0.2.0" });
  await client.connect(transport);
  const { tools } = await client.listTools();
  transport.onclose = () => { delete g.__nexusMcp; };
  // Host đọc annotation: tới khi có thẻ xác nhận trong chat (M11), chỉ đưa tool CHỈ-ĐỌC cho LLM.
  // Annotation là gợi ý từ server — host chỉ tin annotation của server mình kiểm soát.
  const exposed = tools.filter((t) => t.annotations?.readOnlyHint === true);
  return {
    client,
    tools: exposed.map((t) => ({ name: t.name, description: t.description ?? "", inputSchema: t.inputSchema as Record<string, unknown> })),
  };
}

export function mcpHost(): Promise<McpHost> {
  g.__nexusMcp ??= connect().catch((err: unknown) => { delete g.__nexusMcp; throw err; });
  return g.__nexusMcp;
}

export async function callMcpTool(name: string, input: Record<string, unknown>, signal: AbortSignal): Promise<{ content: string; isError: boolean }> {
  const { client } = await mcpHost();
  const res = await client.callTool({ name, arguments: input }, undefined, { signal });
  const content = Array.isArray(res.content) ? res.content.map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n") : "";
  return { content, isError: Boolean(res.isError) };
}
