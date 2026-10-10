import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/** Client SDK thật nối tới server Nexus qua stdio (process con) — dùng cho mọi script. */
export async function connect(env: Record<string, string> = {}): Promise<Client> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../src/index.ts", import.meta.url).pathname],
    env: { ...(process.env as Record<string, string>), NEXUS_DATA: "memory", ...env },
    stderr: "ignore",
  });
  const client = new Client({ name: "nexus-script", version: "1.0.0" });
  await client.connect(transport);
  return client;
}
