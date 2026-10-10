// Chạy authorization server DEV độc lập: ISSUER, RESOURCES (phân cách dấu phẩy), PORT.
import { createDevAuthServer } from "../src/auth/dev-auth-server.ts";

const issuer = process.env["ISSUER"] ?? "http://127.0.0.1:3400";
const resources = (process.env["RESOURCES"] ?? "http://127.0.0.1:3401/mcp").split(",");
const as = await createDevAuthServer({ issuer, resources, user: { sub: process.env["DEV_USER"] ?? "lan", scopes: ["nexus:read", "nexus:write"] } });
const port = Number(new URL(issuer).port || 80);
as.app.listen(port, "127.0.0.1", () => process.stderr.write(`[auth] MCP dev authorization server tại ${issuer} · resources: ${resources.join(", ")}\n`));
