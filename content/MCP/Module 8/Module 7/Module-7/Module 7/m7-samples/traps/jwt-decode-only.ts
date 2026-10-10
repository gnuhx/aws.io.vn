// Bẫy S7.4 — "đọc token" thay vì "kiểm token": decode payload, tin luôn.
import { decodeJwt, generateKeyPair, SignJWT } from "jose";
import { verifyAccessToken } from "../src/auth/resource-server.ts";
import { createDevAuthServer } from "../src/auth/dev-auth-server.ts";
import { createLocalJWKSet } from "jose";

const RES = "https://mcp.example.com/mcp";
const as = await createDevAuthServer({ issuer: "https://auth.example.com", resources: [RES], user: { sub: "lan", scopes: ["nexus:read"] } });
const { privateKey: attacker } = await generateKeyPair("RS256");
const forged = await new SignJWT({ scope: "nexus:read nexus:write" }).setProtectedHeader({ alg: "RS256" })
  .setIssuer("https://auth.example.com").setSubject("admin").setAudience(RES).setExpirationTime("1h").sign(attacker);
const otherApi = await as.mint({ sub: "lan", aud: "https://calendar-api.example.com", scope: "nexus:read nexus:write" });

const naive = (t: string) => {
  const p = decodeJwt(t); // chỉ base64-decode, KHÔNG kiểm chữ ký, aud, iss
  return `chấp nhận sub=${p.sub} scope="${String(p["scope"])}"`;
};
const cfg = { resource: RES, issuer: "https://auth.example.com", jwks: createLocalJWKSet({ keys: [as.jwk] }), scopesSupported: [], requiredScope: "nexus:read", challengeScope: "nexus:read" };
for (const [label, t] of [["token tự ký (khóa kẻ tấn công)", forged], ["token của API lịch (aud khác)", otherApi]] as const) {
  const v = await verifyAccessToken(t, cfg);
  console.log(`${label}\n  decode-only: ${naive(t)}\n  verify     : ${v.ok ? "chấp nhận" : `từ chối — ${v.message}`}`);
}
