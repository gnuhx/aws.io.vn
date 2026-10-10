// Bẫy S7.1 — express.json() đã đọc hết body, rồi gọi handleRequest(req, res) KHÔNG truyền req.body.
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());
app.post("/mcp", async (req, res) => {
  const server = new McpServer({ name: "x", version: "1" });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res); // thiếu tham số thứ 3: req.body
});
const http = app.listen(3901, "127.0.0.1");
const t0 = Date.now();
const r = await fetch("http://127.0.0.1:3901/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "c", version: "1" } } }),
  signal: AbortSignal.timeout(3000),
}).catch((e: unknown) => e);
console.log(r instanceof Response ? `${r.status} sau ${Date.now() - t0}ms: ${await r.text()}` : `không phản hồi sau ${Date.now() - t0}ms: ${String(r)}`);
http.closeAllConnections();
http.close();
