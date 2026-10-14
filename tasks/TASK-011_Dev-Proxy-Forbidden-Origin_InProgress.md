---
id: TASK-011
type: hotfix
module: none
decisions: [D-009]
created: 2026-10-11
---

# TASK-011: Every auth POST returns 403 "forbidden origin" in local dev

Smallest fix + regression test; refactors go in a follow-up task.

## What's broken
Local development only, since TASK-010 added the Vite `/api` proxy. Every state-changing API call from the app at `http://localhost:5173` fails with `403 {"error":"forbidden origin"}`: register, login, Continue with Google, logout, and roadmap progress PUT/DELETE. GET calls (`/api/auth/me`, progress reads) are unaffected. Production on Netlify is not expected to be affected (page and functions share one host there), but that has not been checked on a deploy.

## Reproduce
1. `nvm use && npx netlify-cli dev`, open `http://localhost:5173/register`.
2. Submit a valid email + password, or click Continue with Google.
3. DevTools: `POST http://localhost:5173/api/auth/register 403 (Forbidden)` (same for `/api/auth/google`).

## Expected vs actual
- Expected: register → 201 + session cookie; Google → 200 + session cookie.
- Actual: 403 `forbidden origin` before the handler runs.

## Severity
blocks users (local dev: nobody can sign up or sign in)

## Root cause
Found by reading the code paths (not yet confirmed by a running request; see Notes):

1. The browser sends `Origin: http://localhost:5173` on every POST.
2. `vite.config.ts` proxies with the string shorthand `proxy: { '/api': 'http://localhost:8888' }`. Vite expands a string target to `{ target, changeOrigin: true }` (`node_modules/vite/dist/node/chunks/node.js`, `proxyMiddleware`), so the forwarded request's `Host` becomes `localhost:8888`.
3. `netlify dev` forwards to its functions server without changing `Host`, and builds the function's `request.url` from that header (`netlify-cli/dist/lib/functions/server.js`: `new URL(requestPath, \`${protocol}://${request.get('host')}\`)`). The function sees `request.url = http://localhost:8888/api/auth/register`.
4. `withHttp` in `src/backend/middleware/http.ts` trusts an `Origin` only if it equals `new URL(request.url).origin` or is listed in `ALLOWED_ORIGINS`. `http://localhost:5173` ≠ `http://localhost:8888`, and `ALLOWED_ORIGINS` is empty in `.env`, so it answers 403.

Why the TASK-010 checks missed it: the curl probes through the proxy sent no `Origin` header (the check is skipped when there is none), and the unit tests build `Request`s whose URL and `Origin` already match.

**MongoDB is not the cause.** The 403 is returned before the handler and before any database call, so these requests never reach Atlas. Whether the Atlas connection works is still unknown and is only testable after this fix. If it is wrong, the symptom will be different: `503 {"error":"service is not configured"}` (missing/invalid `MONGODB_URI` / `MONGODB_DB_NAME` / `JWT_SECRET` / `GOOGLE_CLIENT_ID`) or `500 {"error":"request failed"}` with a Mongo error in the `netlify dev` terminal (bad password, IP not on the Atlas access list).

## Fix scope — options (decided: (b), 2026-10-11)
- **(a) Config only:** add `ALLOWED_ORIGINS=http://localhost:5173` to `.env`. No code change. Side effect: the API also sends CORS-with-credentials headers to that origin, which is harmless in dev. Every developer has to remember the line (it would go in `.env.example` and `docs/auth-setup.md`).
- **(b) Keep the Host header in the proxy (recommended):** in `vite.config.ts` use `proxy: { '/api': { target: 'http://localhost:8888', changeOrigin: false } }`. The function then sees `request.url = http://localhost:5173/...`, which matches the browser's `Origin`, so the existing same-origin rule works unchanged and needs no env setting. One line plus a comment. Must confirm that `netlify dev` still routes `/api/*` to the functions when `Host` is `localhost:5173` (it routes by path, so it is expected to).
- **(c) Trust `X-Forwarded-Host`** in `isTrustedOrigin`. Rejected: on Netlify that header comes from the edge, so trusting it in the security check widens what counts as "same origin" in production for a dev-only problem.
- **(d) Drop the Origin check** and rely on `SameSite=Lax` + the JSON content-type rule. Rejected: removes one of the two CSRF layers that D-009 / TASK-010 put in place.
- Out: changing the CSRF design, CORS for deploy previews, testing the Atlas connection itself (comes right after, see Notes).

## Regression test
- [x] Middleware unit test (`src/backend/middleware/http.test.ts`): a POST whose `Origin` (`http://localhost:5173`) differs from `request.url`'s origin (`http://localhost:8888`) and is not in `ALLOWED_ORIGINS` → 403. Pins the current rule so a later fix can't silently weaken it.
- [x] For (b): `src/backend/devProxy.test.ts` loads `vite.config.ts` and asserts the `/api` proxy has `changeOrigin: false`. Checked: fails with the old string shorthand, passes with the fix.
- [x] The same middleware test also covers `ALLOWED_ORIGINS=http://localhost:5173` → request reaches the handler (option (a) stays available as a fallback).
- [ ] Manual: with `netlify dev`, register, log out, log in, and Continue with Google from `http://localhost:5173`. Each returns 2xx and sets the `session` cookie. Also run `curl -X POST -H 'Origin: http://localhost:5173' -H 'content-type: application/json' -d '{}' http://localhost:5173/api/auth/google`: expected 400 (invalid input), not 403.

## Notes
- Implemented (b) in `vite.config.ts`. Backend tests, typecheck and lint pass. The manual check is still open: it needs `netlify dev` running with the real `.env`.
- The root cause was found from code (Vite and netlify-cli sources plus our middleware), without starting servers.
- After the fix, the first real register will be the first Atlas round-trip. If it fails, check the `netlify dev` terminal for the error and the Atlas checklist in `docs/auth-setup.md`.
- `.env` must contain `MONGODB_URI` and `MONGODB_DB_NAME`. Claude cannot read `.env*` files, so their presence has not been checked.
- **Do not copy the contents of `atlas-credentials.env` into `.env` as-is.** TASK-009 and `docs/auth-setup.md` record that its password was exposed and must be rotated first. The app reads only `MONGODB_URI` / `MONGODB_DB_NAME` from `.env`, never that file.
