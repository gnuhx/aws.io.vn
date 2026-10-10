import type { RequestHandler, Router } from "express";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createRemoteJWKSet, errors as joseErrors, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * S7.4 — MCP server là OAuth RESOURCE server: không cấp token, chỉ KIỂM token.
 * resource = URI chuẩn của chính server (vd https://mcp.example.com/mcp) — token phải mang aud = đúng giá trị này.
 */
export type ResourceConfig = {
  resource: string;
  issuer: string;
  jwks: JWTVerifyGetKey;
  scopesSupported: readonly string[];
  /** Scope tối thiểu để vào được /mcp. */
  requiredScope: string;
  /** Scope ghi trong WWW-Authenticate của 401 — client SDK xin ĐÚNG chừng này ở lần authorize đầu. */
  challengeScope: string;
  now?: () => Date;
};

/** reason: mã ASCII (đi vào header HTTP — header KHÔNG nhận tiếng Việt); message: câu cho người đọc (body JSON). */
export type VerifyResult = { ok: true; auth: AuthInfo } | { ok: false; reason: string; message: string };

export function remoteJwks(jwksUri: string): JWTVerifyGetKey {
  return createRemoteJWKSet(new URL(jwksUri), { cooldownDuration: 30_000, timeoutDuration: 3_000 });
}

/** Đường PRM theo RFC 9728: chèn /.well-known/oauth-protected-resource TRƯỚC path của resource. */
export function prmPath(resource: string): string {
  const path = new URL(resource).pathname.replace(/\/$/, "");
  return `/.well-known/oauth-protected-resource${path}`;
}

export function prmUrl(resource: string): string {
  return new URL(prmPath(resource), resource).href;
}

export async function verifyAccessToken(token: string, cfg: ResourceConfig): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, cfg.jwks, {
      issuer: cfg.issuer,
      audience: cfg.resource, // chống token passthrough: token cấp cho API khác thì aud khác → từ chối
      algorithms: ["RS256", "ES256"], // không bao giờ để thư viện tự chọn (alg: none, HS256 với khóa công khai…)
      clockTolerance: 5,
      ...(cfg.now ? { currentDate: cfg.now() } : {}),
    });
    const scopes = typeof payload["scope"] === "string" ? payload["scope"].split(" ").filter(Boolean) : [];
    const cid = payload["client_id"] ?? payload["azp"];
    const clientId = typeof cid === "string" ? cid : "unknown";
    return {
      ok: true,
      auth: {
        token,
        clientId,
        scopes,
        ...(payload.exp !== undefined ? { expiresAt: payload.exp } : {}),
        resource: new URL(cfg.resource),
        extra: { sub: payload.sub ?? null },
      },
    };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) return { ok: false, reason: "token expired", message: "token hết hạn" };
    if (e instanceof joseErrors.JWTClaimValidationFailed) return { ok: false, reason: `invalid ${e.claim}`, message: `claim ${e.claim} không hợp lệ` };
    if (e instanceof joseErrors.JWSSignatureVerificationFailed) return { ok: false, reason: "bad signature", message: "chữ ký sai" };
    if (e instanceof joseErrors.JOSEError) return { ok: false, reason: e.code, message: "token không đọc được" };
    throw e; // lỗi không phải của token (mạng tới JWKS…) → để tầng trên trả 500/503, đừng giả làm 401
  }
}

/** GET /.well-known/oauth-protected-resource/mcp — client đọc cái này để biết hỏi token ở đâu. */
export function mountProtectedResourceMetadata(router: Router, cfg: ResourceConfig): void {
  router.get(prmPath(cfg.resource), (_req, res) => {
    res.set("Cache-Control", "public, max-age=3600").json(protectedResourceMetadata(cfg));
  });
}

export type BearerCheck = { ok: true; auth: AuthInfo } | { ok: false; status: 401 | 403; wwwAuthenticate: string; body: { error: string; error_description?: string } };

/**
 * Lõi thuần, không biết Express hay Request/Response: header Authorization vào → danh tính hoặc lỗi HTTP ra.
 * Adapter Express (requireBearer) và adapter Web-standard (web.ts, S7.5) cùng gọi hàm này.
 */
export async function checkBearer(authorization: string | null | undefined, cfg: ResourceConfig): Promise<BearerCheck> {
  const challenge = (extra: string) => `Bearer resource_metadata="${prmUrl(cfg.resource)}", scope="${cfg.challengeScope}"${extra}`;
  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, status: 401, wwwAuthenticate: challenge(""), body: { error: "unauthorized", error_description: "Thiếu Bearer token" } };
  }
  const v = await verifyAccessToken(authorization.slice(7), cfg);
  if (!v.ok) {
    return { ok: false, status: 401, wwwAuthenticate: challenge(`, error="invalid_token", error_description="${v.reason}"`), body: { error: "invalid_token", error_description: v.message } };
  }
  if (!v.auth.scopes.includes(cfg.requiredScope)) {
    return { ok: false, status: 403, wwwAuthenticate: challenge(`, error="insufficient_scope"`), body: { error: "insufficient_scope" } };
  }
  return v;
}

/** Adapter Express: 401 có WWW-Authenticate trỏ về PRM; 403 insufficient_scope khi token đúng nhưng thiếu quyền. */
export function requireBearer(cfg: ResourceConfig): RequestHandler {
  return async (req, res, next) => {
    const r = await checkBearer(req.headers.authorization, cfg);
    if (!r.ok) return void res.set("WWW-Authenticate", r.wwwAuthenticate).status(r.status).json(r.body);
    req.auth = r.auth; // StreamableHTTPServerTransport đọc req.auth → extra.authInfo trong handler tool
    next();
  };
}

/** Nội dung PRM (RFC 9728) — dùng chung cho Express và Web-standard. */
export function protectedResourceMetadata(cfg: ResourceConfig) {
  return {
    resource: cfg.resource,
    authorization_servers: [cfg.issuer],
    scopes_supported: cfg.scopesSupported,
    bearer_methods_supported: ["header"],
    resource_name: "Nexus MCP (M7 sample)",
  };
}
