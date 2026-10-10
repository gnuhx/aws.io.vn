import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { RESOURCE } from "@nexus/shared";
import type { ToolSpec } from "../llm/types.ts";

export interface McpHost {
  /** Tool đưa cho LLM. Tới M11 (thẻ xác nhận trong chat) chỉ đưa tool readOnlyHint: true. */
  tools(): ToolSpec[];
  /** Resource mà ỨNG DỤNG chọn đưa vào system prompt (M4 · S4.1). Model không tự gọi được resource. */
  context(): string;
  call(name: string, input: Record<string, unknown>, signal: AbortSignal): Promise<{ text: string; isError: boolean }>;
}

function toSpec(t: Tool): ToolSpec {
  return { name: t.name, description: t.description ?? "", inputSchema: t.inputSchema };
}

/** Kết quả tool → chuỗi đưa vào context của LLM (export để đo kích thước ở bài M4). */
export function toText(res: CallToolResult): string {
  return res.content
    .map((c) => {
      if (c.type === "text") return c.text;
      // M4 · S4.5: tham chiếu — model thấy URI + tên, nội dung chỉ đọc khi cần
      if (c.type === "resource_link") return `[resource_link] ${c.uri} ${c.title ?? c.name}`;
      if (c.type === "resource") return "text" in c.resource ? c.resource.text : `[resource ${c.resource.uri}]`;
      return `[${c.type}]`;
    })
    .join("\n");
}

/** Đọc resource text; server không có resource này thì trả chuỗi rỗng (host vẫn chạy). */
async function readText(client: Client, uri: string): Promise<string> {
  try {
    const { contents } = await client.readResource({ uri });
    return contents.map((c) => ("text" in c ? c.text : "")).join("\n");
  } catch {
    return "";
  }
}

async function connect(): Promise<McpHost> {
  const entry = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.NEXUS_MCP_ENTRY ?? "../mcp-server/src/index.ts");
  const client = new Client({ name: "nexus-web", version: "0.3.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      env: { ...(process.env as Record<string, string>), LOG_LEVEL: "warning" },
      stderr: "inherit",
    }),
  );
  const { tools } = await client.listTools();
  const allowed = tools.filter((t) => t.annotations?.readOnlyHint === true);
  // Đọc 1 lần lúc kết nối, dùng cho mọi tin nhắn (resource tĩnh — M4 · S4.3 mới cần theo dõi thay đổi)
  const glossary = await readText(client, RESOURCE.glossary);
  return {
    tools: () => allowed.map(toSpec),
    context: () => glossary,
    async call(name, input, signal) {
      if (!allowed.some((t) => t.name === name)) {
        return { text: `Tool ${name} không được phép gọi từ chat.`, isError: true };
      }
      const res = (await client.callTool({ name, arguments: input }, undefined, { signal })) as CallToolResult;
      return { text: toText(res), isError: res.isError === true };
    },
  };
}

// 1 kết nối MCP cho cả process web — không tạo mới mỗi tin nhắn.
let host: Promise<McpHost> | undefined;
export function getHost(): Promise<McpHost> {
  host ??= connect().catch((err: unknown) => {
    host = undefined; // lần sau thử lại
    throw err;
  });
  return host;
}
