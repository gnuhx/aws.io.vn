import type { Request, Response, Router } from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * S7.2 — Stateless: mỗi POST một server + transport mới, xong là vứt.
 * Không có gì sống qua 2 request → instance nào nhận cũng được → scale ngang sau load balancer.
 */
export function mountStateless(router: Router, makeServer: (req: Request) => McpServer) {
  router.post("/mcp", async (req, res) => {
    const server = makeServer(req);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    // Client ngắt kết nối giữa chừng → đóng transport → signal của tool đang chạy bị abort.
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Không session → không có kênh GET để server đẩy về, không có gì để DELETE.
  const notAllowed = (_req: Request, res: Response) =>
    res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless)" }, id: null });
  router.get("/mcp", notAllowed);
  router.delete("/mcp", notAllowed);
}
