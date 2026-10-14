import type { RequestHandler, Response } from "express";

/**
 * S7.3 — chặn DNS rebinding + request chéo từ trình duyệt.
 * - Host: tên miền trong header phải nằm trong danh sách (so tên, bỏ cổng).
 * - Origin: KHÔNG có thì cho qua (client không phải trình duyệt không gửi Origin);
 *   có thì phải khớp TUYỆT ĐỐI scheme + host + port. Không so chuỗi con, không regex lỏng.
 */
export type GuardConfig = { allowedHosts: readonly string[]; allowedOrigins: readonly string[] };

const deny = (res: Response, message: string) => res.status(403).json({ jsonrpc: "2.0", error: { code: -32000, message }, id: null });

/** "127.0.0.1:3000" → "127.0.0.1", "[::1]:3000" → "[::1]", rác → null. */
export function hostnameOf(hostHeader: string | undefined): string | null {
  if (!hostHeader) return null;
  try {
    return new URL(`http://${hostHeader}`).hostname;
  } catch {
    return null;
  }
}

/** "https://app.example.com:443/x" → "https://app.example.com" (dạng chuẩn hóa của trình duyệt), "null"/rác → null. */
export function originOf(header: string): string | null {
  if (header === "null") return null;
  try {
    const u = new URL(header);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

/** Lõi thuần: trả câu lỗi (→ 403) hoặc null (cho qua). Express và Web-standard dùng chung. */
export function createHostOriginCheck(cfg: GuardConfig) {
  const hosts = new Set(cfg.allowedHosts.map((h) => h.toLowerCase()));
  const origins = new Set(cfg.allowedOrigins.map((o) => originOf(o)).filter((o): o is string => o !== null));
  return (hostHeader: string | null | undefined, originHeader: string | null | undefined): string | null => {
    const host = hostnameOf(hostHeader ?? undefined);
    if (!host || !hosts.has(host)) return `Host không được phép: ${hostHeader ?? "(trống)"}`;
    if (originHeader !== null && originHeader !== undefined) {
      const origin = originOf(originHeader);
      if (!origin || !origins.has(origin)) return `Origin không được phép: ${originHeader}`;
    }
    return null;
  };
}

export function securityGuard(cfg: GuardConfig): RequestHandler {
  const check = createHostOriginCheck(cfg);
  return (req, res, next) => {
    const why = check(req.headers.host, req.headers.origin);
    if (why) return void deny(res, why);
    next();
  };
}

/** Bind local = 127.0.0.1, KHÔNG 0.0.0.0: process khác trong LAN/Wi-Fi quán cà phê không gọi tới được. */
export const LOCAL_BIND = "127.0.0.1";
