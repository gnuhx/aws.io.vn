import { z } from "zod";
import { createApp } from "./app.ts";
import { createFileStore, createMemoryStore } from "./store.ts";
import { remoteJwks } from "./auth/resource-server.ts";
import { SCOPE_READ, SCOPE_WRITE } from "./server.ts";
import { LOCAL_BIND } from "./http/guard.ts";

// Entry HTTP: mọi khác biệt môi trường nằm ở env, code giống hệt local / EC2.
const csv = z.string().transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean));
const Env = z.object({
  MODE: z.enum(["stateful", "stateless"]).default("stateless"),
  HOST: z.string().default(LOCAL_BIND),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  INSTANCE: z.string().default(`pid-${process.pid}`),
  DATA_FILE: z.string().optional(),
  ALLOWED_HOSTS: csv.default(["127.0.0.1", "localhost"]),
  ALLOWED_ORIGINS: csv.default([]),
  MCP_RESOURCE: z.url().optional(),
  AUTH_ISSUER: z.url().optional(),
  AUTH_JWKS_URI: z.url().optional(),
  BEHIND_PROXY: z.stringbool().default(false),
  CACHE_LIST_TTL_MS: z.coerce.number().int().min(0).optional(),
  AUTH_CHALLENGE_SCOPE: z.string().default(`${SCOPE_READ} ${SCOPE_WRITE}`),
  ELICIT_TIMEOUT_MS: z.coerce.number().int().min(100).default(30_000),
});
const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  process.stderr.write(`env sai:\n${z.prettifyError(parsed.error)}\n`);
  process.exit(1);
}
const env = parsed.data;
const authParts = [env.MCP_RESOURCE, env.AUTH_ISSUER, env.AUTH_JWKS_URI].filter(Boolean).length;
if (authParts !== 0 && authParts !== 3) {
  process.stderr.write("env sai: MCP_RESOURCE, AUTH_ISSUER, AUTH_JWKS_URI phải có đủ cả 3 (bật auth) hoặc không có cái nào\n");
  process.exit(1);
}
if (authParts === 0 && env.HOST !== LOCAL_BIND && env.HOST !== "localhost") {
  process.stderr.write(`từ chối: bind ${env.HOST} mà không bật auth — ai trong mạng cũng gọi được tool\n`);
  process.exit(1);
}

const log = (l: string) => process.stderr.write(`[${env.INSTANCE}] ${l}\n`);
const { app, sessions } = createApp({
  mode: env.MODE,
  store: env.DATA_FILE ? createFileStore(env.DATA_FILE) : createMemoryStore(),
  instance: env.INSTANCE,
  guard: { allowedHosts: env.ALLOWED_HOSTS, allowedOrigins: env.ALLOWED_ORIGINS },
  ...(env.MCP_RESOURCE && env.AUTH_ISSUER && env.AUTH_JWKS_URI
    ? { auth: { resource: env.MCP_RESOURCE, issuer: env.AUTH_ISSUER, jwks: remoteJwks(env.AUTH_JWKS_URI), scopesSupported: [SCOPE_READ, SCOPE_WRITE], requiredScope: SCOPE_READ, challengeScope: env.AUTH_CHALLENGE_SCOPE } }
    : {}),
  ...(env.CACHE_LIST_TTL_MS !== undefined ? { cache: { listTtlMs: env.CACHE_LIST_TTL_MS, readTtlMs: 0 } } : {}),
  behindProxy: env.BEHIND_PROXY,
  elicitTimeoutMs: env.ELICIT_TIMEOUT_MS,
  log,
});

const http = app.listen(env.PORT, env.HOST, () => log(`MCP ${env.MODE} tại http://${env.HOST}:${env.PORT}/mcp${env.MCP_RESOURCE ? " (OAuth bật)" : ""}`));

// SIGTERM (systemd stop, deploy): ngừng nhận kết nối mới, đóng session, rồi thoát.
process.once("SIGTERM", () => {
  log("SIGTERM → đóng");
  http.close(() => process.exit(0));
  void sessions?.closeAll();
  http.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
});
