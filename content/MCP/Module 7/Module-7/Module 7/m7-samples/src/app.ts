import express, { type Request } from "express";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { buildServer } from "./server.ts";
import type { TaskStore } from "./store.ts";
import { securityGuard, type GuardConfig } from "./http/guard.ts";
import { mountStateful } from "./http/stateful.ts";
import { mountStateless } from "./http/stateless.ts";
import { mountProtectedResourceMetadata, requireBearer, type ResourceConfig } from "./auth/resource-server.ts";
import { attachCacheHints, type CachePolicy } from "./cache-hints.ts";

export type AppOptions = {
  mode: "stateful" | "stateless";
  store: TaskStore;
  instance: string;
  guard?: GuardConfig;
  auth?: ResourceConfig;
  cache?: Omit<CachePolicy, "perUserLists">;
  /** Sau Nginx: tin X-Forwarded-* từ 1 hop (để req.ip, req.protocol đúng). */
  behindProxy?: boolean;
  log?: (line: string) => void;
  elicitTimeoutMs?: number;
};

/** Composition root: thứ tự middleware LÀ chính sách bảo mật — guard → metadata công khai → token → body → MCP. */
export function createApp(o: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  if (o.behindProxy) app.set("trust proxy", 1);
  app.get("/healthz", (_req, res) => void res.json({ ok: true, instance: o.instance, mode: o.mode }));

  if (o.guard) app.use(securityGuard(o.guard));
  if (o.auth) mountProtectedResourceMetadata(app, o.auth);

  const mcp = express.Router();
  if (o.auth) mcp.use(requireBearer(o.auth));
  mcp.use(express.json({ limit: "1mb" }));

  const cache = o.cache ? { ...o.cache, perUserLists: o.auth !== undefined } : undefined;
  const makeServer = (req: Request) => {
    const server = buildServer({ store: o.store, instance: o.instance, scopes: o.auth ? (req.auth?.scopes ?? []) : undefined, ...(o.log ? { log: o.log } : {}), ...(o.elicitTimeoutMs ? { elicitTimeoutMs: o.elicitTimeoutMs } : {}) });
    if (cache) {
      const connect = server.connect.bind(server);
      server.connect = (t: Transport) => connect(attachCacheHints(t, cache));
    }
    return server;
  };

  const sessions = o.mode === "stateful" ? mountStateful(mcp, makeServer) : (mountStateless(mcp, makeServer), null);
  app.use(mcp);
  return { app, sessions };
}
