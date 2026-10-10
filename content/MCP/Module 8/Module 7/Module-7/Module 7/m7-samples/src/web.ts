import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "./server.ts";
import type { TaskStore } from "./store.ts";
import { createHostOriginCheck, type GuardConfig } from "./http/guard.ts";
import { checkBearer, prmPath, protectedResourceMetadata, type ResourceConfig } from "./auth/resource-server.ts";
import { attachCacheHints, type CachePolicy } from "./cache-hints.ts";

export type FetchHandler = (req: Request) => Promise<Response>;

/**
 * S7.5 — cùng server, viết lại thành 1 hàm `Request → Response` (Web standard).
 * Không Express, không module http của Node: chạy được trên Cloudflare Workers, Deno, Bun, Vercel/Next.js Route Handler, và Node (qua adapter).
 * Luôn stateless: runtime edge không giữ RAM giữa 2 request.
 */
export function createFetchHandler(o: {
  store: TaskStore;
  instance: string;
  guard: GuardConfig;
  auth?: ResourceConfig;
  cache?: Omit<CachePolicy, "perUserLists">;
}): FetchHandler {
  const guard = createHostOriginCheck(o.guard);
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
  const cache = o.cache ? { ...o.cache, perUserLists: o.auth !== undefined } : undefined;

  return async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/healthz") return json(200, { ok: true, instance: o.instance, runtime: "web-standard" });

    const why = guard(req.headers.get("host") ?? url.host, req.headers.get("origin"));
    if (why) return json(403, { jsonrpc: "2.0", error: { code: -32000, message: why }, id: null });

    if (o.auth && req.method === "GET" && url.pathname === prmPath(o.auth.resource)) {
      return json(200, protectedResourceMetadata(o.auth), { "cache-control": "public, max-age=3600" });
    }
    if (url.pathname !== "/mcp") return json(404, { error: "not_found" });
    if (req.method !== "POST") return json(405, { jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless)" }, id: null }, { allow: "POST" });

    let authInfo;
    if (o.auth) {
      const r = await checkBearer(req.headers.get("authorization"), o.auth);
      if (!r.ok) return json(r.status, r.body, { "www-authenticate": r.wwwAuthenticate });
      authInfo = r.auth;
    }

    const server = buildServer({ store: o.store, instance: o.instance, scopes: o.auth ? (authInfo?.scopes ?? []) : undefined });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(cache ? attachCacheHints(transport, cache) : transport);
    req.signal.addEventListener("abort", () => void transport.close(), { once: true }); // client đi → hủy tool đang chạy
    return transport.handleRequest(req, authInfo ? { authInfo } : {});
  };
}
