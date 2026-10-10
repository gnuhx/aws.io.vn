// S7.4 — Trọn luồng OAuth của MCP, phía client (thay Claude Desktop/Cursor): 401 → PRM → metadata AS → đăng ký → authorize + PKCE → token → gọi tool.
import { randomBytes } from "node:crypto";
import { decodeJwt } from "jose";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { FetchLike } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createDevAuthServer } from "../src/auth/dev-auth-server.ts";
import { check, startServer, summary } from "./lib.ts";

const ISSUER = process.env["ISSUER"] ?? "http://127.0.0.1:3400";
const RESOURCE = process.env["RESOURCE"] ?? "http://127.0.0.1:3401/mcp";
const external = process.env["RESOURCE"] !== undefined; // s75: server đã chạy sau Nginx

let step = 0;
const short = (u: string) => u.replace(/([?&](code|state|code_challenge)=)[^&]{6}[^&]*/g, "$1…").replace(/https?:\/\/(127\.0\.0\.1|localhost):/g, ":");
/** fetch có log: thấy từng bước của luồng trên dây. */
const loggingFetch: FetchLike = async (url, init) => {
  const res = await fetch(url, init);
  const auth = new Headers(init?.headers).get("authorization") ? " [Bearer]" : "";
  console.log(`${String(++step).padStart(2)}. ${(init?.method ?? "GET").padEnd(4)} ${short(String(url))}${auth} → ${res.status}`);
  return res;
};

/** "Trình duyệt + người dùng bấm Đồng ý" thu nhỏ. Claude Desktop/Cursor mở trình duyệt thật ở bước này. */
class HeadlessProvider implements OAuthClientProvider {
  info: OAuthClientInformationMixed | undefined;
  saved: OAuthTokens | undefined;
  verifier = "";
  expectedState = "";
  code = "";
  readonly redirectUrl = "http://127.0.0.1:3499/callback";
  get clientMetadata(): OAuthClientMetadata {
    return { client_name: "m7-headless", redirect_uris: [this.redirectUrl], grant_types: ["authorization_code"], response_types: ["code"], token_endpoint_auth_method: "none", scope: "nexus:read nexus:write" };
  }
  state() {
    return (this.expectedState = randomBytes(16).toString("base64url"));
  }
  clientInformation() { return this.info; }
  saveClientInformation(i: OAuthClientInformationMixed) { this.info = i; }
  tokens() { return this.saved; }
  saveTokens(t: OAuthTokens) { this.saved = t; }
  saveCodeVerifier(v: string) { this.verifier = v; }
  codeVerifier() { return this.verifier; }
  async redirectToAuthorization(url: URL) {
    const res = await fetch(url, { redirect: "manual" });
    const back = new URL(res.headers.get("location") ?? "");
    console.log(`${String(++step).padStart(2)}. [trình duyệt] ${short(url.href.split("?")[0] ?? "")}?…&code_challenge_method=${url.searchParams.get("code_challenge_method")}&resource=${short(url.searchParams.get("resource") ?? "")} → ${res.status} → ${short(back.origin + back.pathname)}?code=…&iss=${back.searchParams.get("iss")}`);
    if (back.searchParams.get("state") !== this.expectedState) throw new Error("state không khớp (CSRF)");
    if (back.searchParams.get("iss") !== ISSUER) throw new Error("iss không khớp (RFC 9207, mix-up attack)");
    this.code = back.searchParams.get("code") ?? "";
  }
}

const as = external ? null : await createDevAuthServer({ issuer: ISSUER, resources: [RESOURCE], user: { sub: "lan", scopes: ["nexus:read", "nexus:write"] } });
const asHttp = as?.app.listen(3400, "127.0.0.1");
const rs = external ? null : await startServer({ MODE: "stateless", PORT: "3401", INSTANCE: "RS", MCP_RESOURCE: RESOURCE, AUTH_ISSUER: ISSUER, AUTH_JWKS_URI: `${ISSUER}/jwks`, ...(process.env["AUTH_CHALLENGE_SCOPE"] ? { AUTH_CHALLENGE_SCOPE: process.env["AUTH_CHALLENGE_SCOPE"] } : {}) });

const provider = new HeadlessProvider();
const first = new StreamableHTTPClientTransport(new URL(RESOURCE), { authProvider: provider, fetch: loggingFetch });
const c1 = new Client({ name: "m7-headless", version: "1" });
let unauthorized = false;
try {
  await c1.connect(first);
} catch (e) {
  unauthorized = e instanceof UnauthorizedError;
  console.log(`    connect() ném ${e instanceof Error ? e.constructor.name : "?"} → người dùng đã duyệt, đổi code lấy token`);
}
check(unauthorized, "lần đầu: 401 → client tự đi hết discovery + đăng ký + authorize");
await first.finishAuth(provider.code);
const claims = decodeJwt(provider.saved?.access_token ?? "");
console.log(`    access_token: aud=${String(claims.aud)} · scope="${String(claims["scope"])}" · sub=${claims.sub} · hết hạn sau ${(claims.exp ?? 0) - Math.floor(Date.now() / 1000)}s`);
check(claims.aud === RESOURCE, "token gắn đúng resource (RFC 8707) — server khác không dùng lại được");

const c2 = new Client({ name: "m7-headless", version: "1" });
await c2.connect(new StreamableHTTPClientTransport(new URL(RESOURCE), { authProvider: provider, fetch: loggingFetch }));
const tools = await c2.listTools();
const created = await c2.callTool({ name: "nexus_create_task", arguments: { title: "Việc tạo qua OAuth", owner: "lan" } });
console.log(`    tools: ${tools.tools.map((t) => t.name).join(", ")}`);
console.log(`    nexus_create_task → ${JSON.stringify(created.structuredContent)}`);
check(!created.isError, "gọi tool ghi thành công bằng token vừa lấy");
const t0 = Date.now();
const marks: number[] = [];
await c2.callTool({ name: "nexus_generate_report", arguments: { steps: 4, delayMs: 250 } }, undefined, { onprogress: () => void marks.push(Date.now() - t0) });
console.log(`    progress đến @${marks.join("ms, @")}ms · xong @${Date.now() - t0}ms`);
await c2.close();
await c1.close().catch(() => undefined);
await rs?.stop();
asHttp?.close();
summary("OAuth flow");
