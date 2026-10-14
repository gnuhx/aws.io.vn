import { createHash, randomBytes, randomUUID } from "node:crypto";
import express from "express";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";

/**
 * Authorization server DEV — chỉ để chạy thật luồng OAuth 2.1 trong máy (thay Auth0/Keycloak/Cognito).
 * Có: metadata RFC 8414, đăng ký động RFC 7591, authorize + PKCE S256, token JWT RS256, JWKS, `iss` trong redirect (RFC 9207).
 * KHÔNG có: màn hình đăng nhập/consent (tự duyệt cho DEV_USER), refresh token, thu hồi. Production: dùng provider thật.
 */
export type DevAuthOptions = {
  issuer: string;
  /** Resource được phép xin token (RFC 8707). Khác danh sách → từ chối. */
  resources: readonly string[];
  user: { sub: string; scopes: readonly string[] };
  tokenTtlS?: number;
};

type Client = { client_id: string; redirect_uris: string[]; client_name?: string };
type Code = { clientId: string; redirectUri: string; challenge: string; scope: string; resource: string; exp: number };

export async function createDevAuthServer(opts: DevAuthOptions) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const kid = randomUUID().slice(0, 8);
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid, alg: "RS256", use: "sig" };
  const clients = new Map<string, Client>();
  const codes = new Map<string, Code>();
  const ttl = opts.tokenTtlS ?? 3600;

  /** Ký token. Dùng trực tiếp trong test để tạo token sai aud / hết hạn / thiếu scope. */
  async function mint(claims: { sub: string; aud: string; scope: string; clientId?: string; expSecondsFromNow?: number; issuer?: string; key?: CryptoKey }) {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ scope: claims.scope, client_id: claims.clientId ?? "dev-test" })
      .setProtectedHeader({ alg: "RS256", kid, typ: "at+jwt" })
      .setIssuer(claims.issuer ?? opts.issuer)
      .setSubject(claims.sub)
      .setAudience(claims.aud)
      .setIssuedAt(now)
      .setExpirationTime(now + (claims.expSecondsFromNow ?? ttl))
      .setJti(randomUUID())
      .sign(claims.key ?? privateKey);
  }

  const app = express();
  app.use(express.urlencoded({ extended: false }), express.json());
  const oauthError = (res: express.Response, status: number, error: string, description: string) =>
    res.status(status).json({ error, error_description: description });

  app.get("/.well-known/oauth-authorization-server", (_req, res) => {
    res.json({
      issuer: opts.issuer,
      authorization_endpoint: `${opts.issuer}/authorize`,
      token_endpoint: `${opts.issuer}/token`,
      registration_endpoint: `${opts.issuer}/register`,
      jwks_uri: `${opts.issuer}/jwks`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: opts.user.scopes,
      authorization_response_iss_parameter_supported: true,
    });
  });

  app.get("/jwks", (_req, res) => void res.json({ keys: [jwk] }));

  app.post("/register", (req, res) => {
    const uris: unknown = req.body?.redirect_uris;
    if (!Array.isArray(uris) || uris.length === 0 || !uris.every((u) => typeof u === "string")) {
      return void oauthError(res, 400, "invalid_redirect_uri", "redirect_uris phải là mảng URL");
    }
    const c: Client = { client_id: `dev-${randomBytes(6).toString("hex")}`, redirect_uris: uris, client_name: String(req.body.client_name ?? "") };
    clients.set(c.client_id, c);
    res.status(201).json({ ...req.body, ...c, client_id_issued_at: Math.floor(Date.now() / 1000), token_endpoint_auth_method: "none" });
  });

  app.get("/authorize", (req, res) => {
    const q = (k: string) => (typeof req.query[k] === "string" ? req.query[k] : "");
    const client = clients.get(q("client_id"));
    // redirect_uri sai thì KHÔNG redirect (tránh open redirect) — trả lỗi tại chỗ.
    if (!client || !client.redirect_uris.includes(q("redirect_uri"))) return void oauthError(res, 400, "invalid_request", "client_id/redirect_uri không khớp đăng ký");
    const back = new URL(q("redirect_uri"));
    const fail = (error: string) => {
      back.searchParams.set("error", error);
      back.searchParams.set("state", q("state"));
      res.redirect(302, back.href);
    };
    if (q("response_type") !== "code") return fail("unsupported_response_type");
    if (q("code_challenge_method") !== "S256" || q("code_challenge").length < 43) return fail("invalid_request"); // PKCE bắt buộc
    if (!opts.resources.includes(q("resource"))) return fail("invalid_target");
    const asked = q("scope").split(" ").filter(Boolean);
    const granted = (asked.length ? asked : [...opts.user.scopes]).filter((s) => opts.user.scopes.includes(s));
    const code = randomBytes(24).toString("base64url");
    codes.set(code, { clientId: client.client_id, redirectUri: q("redirect_uri"), challenge: q("code_challenge"), scope: granted.join(" "), resource: q("resource"), exp: Date.now() + 60_000 });
    back.searchParams.set("code", code);
    back.searchParams.set("state", q("state"));
    back.searchParams.set("iss", opts.issuer);
    res.redirect(302, back.href);
  });

  app.post("/token", async (req, res) => {
    const b = (k: string) => (typeof req.body?.[k] === "string" ? String(req.body[k]) : "");
    if (b("grant_type") !== "authorization_code") return void oauthError(res, 400, "unsupported_grant_type", "chỉ hỗ trợ authorization_code");
    const c = codes.get(b("code"));
    codes.delete(b("code")); // code dùng 1 lần
    if (!c || c.exp < Date.now()) return void oauthError(res, 400, "invalid_grant", "code không tồn tại / đã dùng / hết hạn");
    if (c.clientId !== b("client_id") || c.redirectUri !== b("redirect_uri")) return void oauthError(res, 400, "invalid_grant", "client/redirect_uri khác lúc authorize");
    const verifierHash = createHash("sha256").update(b("code_verifier")).digest("base64url");
    if (verifierHash !== c.challenge) return void oauthError(res, 400, "invalid_grant", "PKCE code_verifier sai");
    if (b("resource") && b("resource") !== c.resource) return void oauthError(res, 400, "invalid_target", "resource khác lúc authorize");
    const access_token = await mint({ sub: opts.user.sub, aud: c.resource, scope: c.scope, clientId: c.clientId });
    res.set("Cache-Control", "no-store").json({ access_token, token_type: "Bearer", expires_in: ttl, scope: c.scope });
  });

  return { app, mint, jwk, clientCount: () => clients.size };
}
