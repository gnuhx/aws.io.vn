import { randomUUID } from "node:crypto";
import type { Request, Response, Router } from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

type Session = { transport: StreamableHTTPServerTransport; server: McpServer; subject: string | null; lastSeen: number };

const rpcError = (res: Response, http: number, code: number, message: string) =>
  res.status(http).json({ jsonrpc: "2.0", error: { code, message }, id: null });

/**
 * S7.1 — Streamable HTTP có session (spec 2025-11-25).
 * 1 session = 1 transport + 1 McpServer, sống trong RAM của ĐÚNG process này (lý do S7.2 tồn tại).
 */
export function mountStateful(router: Router, makeServer: (req: Request) => McpServer, opts: { idleMs?: number } = {}) {
  const sessions = new Map<string, Session>();
  const subjectOf = (req: Request) => (typeof req.auth?.extra?.["sub"] === "string" ? req.auth.extra["sub"] : null);

  /** Tìm session của request; trả null sau khi đã tự trả lỗi. */
  const find = (req: Request, res: Response): Session | null => {
    const id = req.header("mcp-session-id");
    if (!id) return (rpcError(res, 400, -32000, "Bad Request: thiếu Mcp-Session-Id (chỉ initialize được gửi không có session)"), null);
    const s = sessions.get(id);
    if (!s) return (rpcError(res, 404, -32001, "Session not found: hết hạn hoặc thuộc instance khác — client phải initialize lại"), null);
    if (s.subject !== subjectOf(req)) return (rpcError(res, 403, -32000, "Session thuộc người khác"), null); // S7.4: id session KHÔNG phải là xác thực
    s.lastSeen = Date.now();
    return s;
  };

  router.post("/mcp", async (req, res) => {
    if (req.header("mcp-session-id")) {
      const s = find(req, res);
      if (s) await s.transport.handleRequest(req, res, req.body);
      return;
    }
    if (!isInitializeRequest(req.body)) return void rpcError(res, 400, -32000, "Bad Request: request đầu tiên phải là initialize");

    const server = makeServer(req);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => void sessions.set(id, { transport, server, subject: subjectOf(req), lastSeen: Date.now() }),
    });
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // GET = kênh SSE server → client (notification, request ngược). DELETE = client đóng session.
  const passthrough = async (req: Request, res: Response) => {
    const s = find(req, res);
    if (s) await s.transport.handleRequest(req, res);
  };
  router.get("/mcp", passthrough);
  router.delete("/mcp", passthrough);

  // Dọn session bỏ quên: client không bắt buộc gửi DELETE.
  const idleMs = opts.idleMs ?? 30 * 60_000;
  const timer = setInterval(() => {
    for (const [id, s] of sessions) if (Date.now() - s.lastSeen > idleMs) void s.transport.close().then(() => sessions.delete(id));
  }, Math.min(idleMs, 60_000));
  timer.unref();

  return { count: () => sessions.size, closeAll: () => Promise.all([...sessions.values()].map((s) => s.transport.close())) };
}
