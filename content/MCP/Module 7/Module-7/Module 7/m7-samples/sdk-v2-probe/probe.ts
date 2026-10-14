// SDK v2 2.3.1: createMcpHandler(factory) — 1 handler phục vụ CẢ spec 2026-07-28 (không session, không initialize) LẪN client 2025-11-25.
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const handler = createMcpHandler(() => {
  const s = new McpServer({ name: "nexus-v2", version: "0.7.0" }, { cacheHints: { "tools/list": { ttlMs: 300_000, cacheScope: "public" } } });
  s.registerTool("nexus_list_tasks", { description: "Việc của team", inputSchema: z.object({ owner: z.string().optional() }) }, async ({ owner }) => ({
    content: [{ type: "text", text: `việc của ${owner ?? "mọi người"}` }],
  }));
  return s;
});

const META = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": { name: "probe", version: "1" } };
async function post(label: string, body: unknown, headers: Record<string, string> = {}) {
  const r = await handler.fetch(new Request("http://localhost/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers }, body: JSON.stringify(body) }));
  const text = await r.text();
  const data = text.startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data: "))?.slice(6) ?? text;
  console.log(`${label}\n  → ${r.status} ${r.headers.get("content-type")} · mcp-session-id: ${r.headers.get("mcp-session-id") ?? "—"}\n  ${data.length > 300 ? `${data.slice(0, 299)}…` : data}`);
}

await post("1. 2026-07-28: server/discover", { jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: META } }, { "mcp-protocol-version": "2026-07-28", "mcp-method": "server/discover" });
await post("2. 2026-07-28: tools/list (không initialize trước)", { jsonrpc: "2.0", id: 2, method: "tools/list", params: { _meta: META } }, { "mcp-protocol-version": "2026-07-28", "mcp-method": "tools/list" });
await post("3. 2026-07-28: thiếu header Mcp-Method", { jsonrpc: "2.0", id: 3, method: "tools/list", params: { _meta: META } }, { "mcp-protocol-version": "2026-07-28" });
await post("4. client 2025-11-25: initialize", { jsonrpc: "2.0", id: 4, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "old", version: "1" } } });
await handler.close();
