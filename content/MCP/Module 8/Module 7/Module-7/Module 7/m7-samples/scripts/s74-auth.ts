// S7.4 — Resource server: 401 + WWW-Authenticate, PRM, verify JWT (chữ ký, aud, exp, iss), tool theo scope.
import { generateKeyPair } from "jose";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { createDevAuthServer } from "../src/auth/dev-auth-server.ts";
import { ACCEPT_BOTH, check, cut, initBody, raw, startServer, summary } from "./lib.ts";

const ISSUER = "http://127.0.0.1:3400";
const RESOURCE = "http://127.0.0.1:3401/mcp";
const as = await createDevAuthServer({ issuer: ISSUER, resources: [RESOURCE], user: { sub: "lan", scopes: ["nexus:read", "nexus:write"] } });
const asHttp = as.app.listen(3400, "127.0.0.1");
const rs = await startServer({ MODE: "stateless", PORT: "3401", INSTANCE: "RS", MCP_RESOURCE: RESOURCE, AUTH_ISSUER: ISSUER, AUTH_JWKS_URI: `${ISSUER}/jwks` });

console.log("— Không token —");
const r0 = await raw(RESOURCE, { body: initBody(), headers: ACCEPT_BOTH });
console.log(`${r0.status} WWW-Authenticate: ${r0.headers["www-authenticate"]}`);
check(r0.status === 401 && String(r0.headers["www-authenticate"]).includes("resource_metadata="), "401 chỉ đường tới Protected Resource Metadata");

const prm = await raw("http://127.0.0.1:3401/.well-known/oauth-protected-resource/mcp");
console.log(`GET /.well-known/oauth-protected-resource/mcp → ${prm.status} ${prm.body}`);
check(prm.status === 200 && JSON.parse(prm.body).authorization_servers[0] === ISSUER, "PRM nói: hỏi token ở " + ISSUER);

console.log("\n— Token sai đủ kiểu —");
const { privateKey: attackerKey } = await generateKeyPair("RS256");
const bad: { label: string; token: string; want: number }[] = [
  { label: "aud là API khác (token passthrough)", token: await as.mint({ sub: "lan", aud: "https://api.other.example", scope: "nexus:read nexus:write" }), want: 401 },
  { label: "hết hạn 1 phút trước", token: await as.mint({ sub: "lan", aud: RESOURCE, scope: "nexus:read", expSecondsFromNow: -60 }), want: 401 },
  { label: "ký bằng khóa khác, cùng kid", token: await as.mint({ sub: "lan", aud: RESOURCE, scope: "nexus:read", key: attackerKey }), want: 401 },
  { label: "issuer khác", token: await as.mint({ sub: "lan", aud: RESOURCE, scope: "nexus:read", issuer: "https://evil.example" }), want: 401 },
  { label: "chuỗi rác", token: "abc.def.ghi", want: 401 },
  { label: "chỉ có nexus:write, thiếu nexus:read", token: await as.mint({ sub: "lan", aud: RESOURCE, scope: "nexus:write" }), want: 403 },
];
for (const k of bad) {
  const r = await raw(RESOURCE, { body: initBody(), headers: { ...ACCEPT_BOTH, authorization: `Bearer ${k.token}` } });
  check(r.status === k.want, `${r.status} ${k.label.padEnd(38)}`, cut(String(r.headers["www-authenticate"]).replace(/^.*?scope="[^"]*"(, )?/, ""), 70));
}

const connect = async (scope: string) => {
  const token = await as.mint({ sub: "lan", aud: RESOURCE, scope });
  const c = new Client({ name: "s74", version: "1" });
  await c.connect(new StreamableHTTPClientTransport(new URL(RESOURCE), { requestInit: { headers: { authorization: `Bearer ${token}` } } }));
  return c;
};

console.log("\n— Tool theo scope —");
const ro = await connect("nexus:read");
const roTools = (await ro.listTools()).tools.map((t) => t.name);
console.log(`nexus:read             → ${roTools.join(", ")}`);
const roCreate = CallToolResultSchema.parse(await ro.callTool({ name: "nexus_create_task", arguments: { title: "Thử ghi lén", owner: "lan" } }));
console.log(`  gọi thẳng nexus_create_task → ${roCreate.isError ? "[isError] " : ""}${roCreate.content[0]?.type === "text" ? roCreate.content[0].text : ""}`);
check(!roTools.includes("nexus_create_task") && roCreate.isError === true, "token chỉ đọc: tool ghi không có trong tools/list, gọi thẳng cũng không được");
const rw = await connect("nexus:read nexus:write");
const rwTools = (await rw.listTools()).tools.map((t) => t.name);
console.log(`nexus:read nexus:write → ${rwTools.join(", ")}`);
const who = await rw.callTool({ name: "nexus_whoami", arguments: {} });
console.log(`  nexus_whoami → ${JSON.stringify(who.structuredContent)}`);
check(rwTools.includes("nexus_create_task"), "token có nexus:write thấy tool ghi");
await ro.close();
await rw.close();

console.log(`\nlog RS: ${rs.logs.join(" | ")}`);
await rs.stop();
asHttp.close();
summary("S7.4");
