// S7.5 — Web-standard handler (chạy như hàm, rồi chạy trên Node) + cache hint ttlMs/cacheScope + client tôn trọng TTL.
import { createLocalJWKSet } from "jose";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createFetchHandler } from "../src/web.ts";
import { createMemoryStore } from "../src/store.ts";
import { createDevAuthServer } from "../src/auth/dev-auth-server.ts";
import { createTtlCache } from "../src/client-cache.ts";
import { check, cut, startServer, summary } from "./lib.ts";

const H = { "content-type": "application/json", accept: "application/json, text/event-stream" };
const rpc = (id: number, method: string, params: Record<string, unknown> = {}) => JSON.stringify({ jsonrpc: "2.0", id, method, params });
const sse = async (r: Response) => JSON.parse((await r.text()).split("\n").find((l) => l.startsWith("data: "))?.slice(6) ?? "null");

console.log("— 1. Handler là 1 hàm: Request vào, Response ra (không cổng, không Express) —");
const guard = { allowedHosts: ["localhost", "127.0.0.1"], allowedOrigins: [] };
const handler = createFetchHandler({ store: createMemoryStore(), instance: "fn", guard, cache: { listTtlMs: 300_000, readTtlMs: 0 } });
const init = await handler(new Request("http://localhost/mcp", { method: "POST", headers: H, body: rpc(0, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "fn", version: "1" } }) }));
console.log(`initialize → ${init.status} ${init.headers.get("content-type")} · mcp-session-id: ${init.headers.get("mcp-session-id") ?? "(không có — stateless)"}`);
const list = await sse(await handler(new Request("http://localhost/mcp", { method: "POST", headers: H, body: rpc(1, "tools/list") })));
console.log(`tools/list → ${list.result.tools.length} tool · ttlMs=${list.result.ttlMs} · cacheScope=${list.result.cacheScope}`);
check(list.result.ttlMs === 300000 && list.result.cacheScope === "public", "không auth: list giống nhau cho mọi người → public");
const evil = await handler(new Request("http://localhost/mcp", { method: "POST", headers: { ...H, origin: "https://evil.example" }, body: rpc(2, "tools/list") }));
console.log(`Origin lạ → ${evil.status} ${cut(await evil.text(), 90)}`);
check(evil.status === 403, "guard dùng chung lõi với Express");

console.log("\n— 2. Cùng handler, bật OAuth —");
const RES = "http://localhost/mcp";
const as = await createDevAuthServer({ issuer: "http://127.0.0.1:3400", resources: [RES], user: { sub: "lan", scopes: ["nexus:read", "nexus:write"] } });
const authed = createFetchHandler({
  store: createMemoryStore(), instance: "fn-auth", guard, cache: { listTtlMs: 300_000, readTtlMs: 0 },
  auth: { resource: RES, issuer: "http://127.0.0.1:3400", jwks: createLocalJWKSet({ keys: [as.jwk] }), scopesSupported: ["nexus:read", "nexus:write"], requiredScope: "nexus:read", challengeScope: "nexus:read nexus:write" },
});
const noTok = await authed(new Request(RES, { method: "POST", headers: H, body: rpc(1, "tools/list") }));
console.log(`không token → ${noTok.status} · www-authenticate: ${noTok.headers.get("www-authenticate")}`);
const tok = await as.mint({ sub: "lan", aud: RES, scope: "nexus:read" });
const ro = await sse(await authed(new Request(RES, { method: "POST", headers: { ...H, authorization: `Bearer ${tok}` }, body: rpc(1, "tools/list") })));
console.log(`token nexus:read → ${ro.result.tools.map((t: { name: string }) => t.name).join(", ")} · cacheScope=${ro.result.cacheScope}`);
check(noTok.status === 401 && ro.result.cacheScope === "private", "list lọc theo token → private (gateway không được chia sẻ cho người khác)");

console.log("\n— 3. Chạy trên Node (adapter @hono/node-server), client SDK v1 —");
const web = await startServer({ PORT: "3501" }, "src/web-node.ts");
const c = new Client({ name: "s75", version: "1" });
await c.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3501/mcp")));
const tools = await c.listTools();
const marks: number[] = [];
const t0 = Date.now();
await c.callTool({ name: "nexus_generate_report", arguments: { steps: 3, delayMs: 200 } }, undefined, { onprogress: () => void marks.push(Date.now() - t0) });
console.log(`SDK 1.30.1 listTools: ${tools.tools.length} tool (field lạ ttlMs/cacheScope bị bỏ qua, không lỗi) · progress @${marks.join("ms, @")}ms`);
check(tools.tools.length === 5 && marks.length === 3, "client cũ vẫn chạy với server có field mới; progress vẫn stream");
await c.close();
await web.stop();

console.log("\n— 4. Client tôn trọng ttlMs (đồng hồ giả) —");
let clock = 0;
let failNext = false;
const cache = createTtlCache(async () => {
  if (failNext) throw new Error("server sập");
  return { tools: ["a", "b"], ttlMs: 300_000 };
}, () => clock);
const seen: string[] = [];
for (const [at, action] of [[0, "get"], [60_000, "get"], [299_999, "get"], [300_000, "get"], [310_000, "list_changed"], [310_001, "get"], [700_000, "down"]] as const) {
  clock = at;
  if (action === "list_changed") {
    cache.invalidate();
    seen.push(`t=${at / 1000}s list_changed → invalidate`);
    continue;
  }
  failNext = action === "down";
  seen.push(`t=${at / 1000}s ${action === "down" ? "get (server sập)" : "get"} → ${(await cache.get()).from}`);
}
console.log(seen.join("\n"));
check(cache.fetches() === 4, "6 lần cần list → 4 lần ra mạng (1 lần thất bại dùng bản cũ)");
summary("S7.5 web + cache");
