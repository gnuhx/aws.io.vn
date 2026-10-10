// "Dịch thẳng từ C#" — S7.4: AuthenticationHandler<TOptions> + exception làm luồng điều khiển. ĐỪNG viết thế này.
import { decodeJwt } from "jose";

export class UnauthorizedException extends Error {}
export class ForbiddenException extends Error {}

export abstract class AuthenticationHandlerBase<TOptions> {
  protected readonly options: TOptions;
  constructor(options: TOptions) {
    this.options = options; // `constructor(protected readonly options)` kiểu C# 12 primary ctor: tsc chặn (erasableSyntaxOnly)
  }
  abstract handleAuthenticateAsync(header: string | undefined): Promise<Record<string, unknown>>;
}

export class JwtBearerHandler extends AuthenticationHandlerBase<{ audience: string; requiredScope: string }> {
  async handleAuthenticateAsync(header: string | undefined) {
    if (!header) throw new UnauthorizedException("missing token"); // 401 nhưng không có WWW-Authenticate → client không biết đi đâu lấy token
    const claims = decodeJwt(header.replace("Bearer ", "")); // "TODO: validate signature"
    if (claims.aud !== this.options.audience) throw new UnauthorizedException("bad audience");
    if (!String(claims["scope"]).includes(this.options.requiredScope)) throw new ForbiddenException(); // includes: "nexus:readonly" chứa "nexus:read"
    return claims;
  }
}
