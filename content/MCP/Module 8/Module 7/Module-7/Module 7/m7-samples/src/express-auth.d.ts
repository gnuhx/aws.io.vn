import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

// req.auth: chỗ middleware token (S7.4) gửi danh tính cho StreamableHTTPServerTransport → extra.authInfo trong tool.
// Tương đương HttpContext.User — nhưng TS không có sẵn, phải tự "mở rộng" kiểu Request của Express.
declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthInfo;
  }
}
