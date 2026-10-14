# m7-samples — Remote MCP, Auth & Deploy (Module 7)

Code độc lập (không phụ thuộc repo Nexus) cho 5 session của Module 7. Bài học đầy đủ: `../Module-7-Remote-Auth-Deploy.html` (hoặc `.md`).

Node ≥ 22.18 (chạy `.ts` trực tiếp bằng type stripping) · TypeScript 6.0.3 · `@modelcontextprotocol/sdk` 1.30.1 (khớp C50, spec 2025-11-25) · Express 5 · jose 6.

```bash
npm install
npm run check          # typecheck + 6 kịch bản S7.1–S7.5, ~25 giây, không cần mạng ngoài
npm run s75:nginx      # cần nginx + openssl: Nginx thật + TLS tự ký + OAuth trọn luồng qua https://localhost:8443/mcp
bash scripts/capture-runs.sh   # chụp lại mọi output vào ../runs/
```

## Cây thư mục

| Đường dẫn | Session | Là gì |
|---|---|---|
| `src/server.ts` | S7.1 | `buildServer(ctx)` — 1 định nghĩa tool cho mọi transport; lọc tool theo scope (S7.4) |
| `src/store.ts` | S7.2 | `TaskStore`: RAM (1 process) hoặc file JSON (nhiều instance dùng chung) |
| `src/stdio.ts` | S7.1 | entry stdio |
| `src/http/stateful.ts` | S7.1 | Streamable HTTP có `Mcp-Session-Id` |
| `src/http/stateless.ts` | S7.2 | mỗi POST 1 server + transport mới |
| `src/http/guard.ts` | S7.3 | kiểm Host + Origin (lõi thuần + adapter Express) |
| `src/auth/resource-server.ts` | S7.4 | PRM (RFC 9728), `checkBearer`, verify JWT bằng JWKS |
| `src/auth/dev-auth-server.ts` | S7.4 | authorization server DEV (RFC 8414, 7591, PKCE, JWKS) — thay Auth0/Keycloak khi chạy thử |
| `src/app.ts` · `src/main.ts` | tất cả | composition root Express · entry đọc env (zod), từ chối cấu hình nguy hiểm |
| `src/web.ts` · `src/web-node.ts` | S7.5 | cùng server dạng `Request → Response` (Workers/Deno/Bun/Next.js) · chạy trên Node |
| `src/cache-hints.ts` · `src/client-cache.ts` | S7.5 | `ttlMs` + `cacheScope` (spec 2026-07-28) phía server · client tôn trọng TTL |
| `deploy/` | S7.5 | `nginx/mcp.conf`, `systemd/nexus-mcp@.service`, `mcp.env.example` |
| `scripts/` | | kịch bản chạy thật cho từng session + `lib.ts` (spawn server, HTTP thô, LB round-robin) |
| `traps/` · `patterns/` | | bẫy có output lỗi thật · bản "dịch thẳng từ C#" để so sánh (đều qua tsc) |
| `sdk-v2-probe/` | S7.5 | cùng tool viết bằng SDK v2 2.3.1 — xem spec 2026-07-28 trên dây |

## Biến môi trường (`src/main.ts`)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `MODE` | `stateless` | `stateful` (có session) / `stateless` |
| `HOST` · `PORT` | `127.0.0.1` · `3000` | bind khác localhost mà không bật auth → từ chối khởi động |
| `ALLOWED_HOSTS` · `ALLOWED_ORIGINS` | `127.0.0.1,localhost` · rỗng | danh sách tuyệt đối, phân cách dấu phẩy |
| `MCP_RESOURCE` · `AUTH_ISSUER` · `AUTH_JWKS_URI` | — | đủ cả 3 = bật OAuth; thiếu 1 = lỗi |
| `AUTH_CHALLENGE_SCOPE` | `nexus:read nexus:write` | scope ghi trong 401 — client xin đúng chừng này |
| `DATA_FILE` | — | store file dùng chung (bắt buộc khi chạy ≥ 2 instance) |
| `BEHIND_PROXY` | `false` | sau Nginx: tin `X-Forwarded-*` 1 hop |
| `CACHE_LIST_TTL_MS` | — | bật cache hint cho `tools/list` |
| `ELICIT_TIMEOUT_MS` | `30000` | chờ người dùng xác nhận xóa |
