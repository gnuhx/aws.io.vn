---
id: TASK-010
type: feature
module: none
decisions: [D-001, D-003, D-007, D-009]
created: 2026-10-11
---

# TASK-010: Replace Clerk with custom email/password and Google auth

## Goal
Learners sign up and sign in with email + password or Google through the site's own auth (httpOnly JWT cookie, users in Atlas), so the site no longer depends on Clerk.

## Context
- D-009 (Accepted 2026-10-11) supersedes D-008 (Clerk). D-007 fixes the backend layout: thin endpoints in `src/backend/functions/`, `withAuth(...)` / `publicEndpoint(...)` wrappers in `middleware/`, logic in `services/`, Mongo access in `repositories/`, clients in `clients/`. D-003: no separate `server/` package.
- The repo already has a backend and a database, so requirement 5 of the original request ("Express in `server/`, Prisma + SQLite") does **not** apply: auth endpoints are Netlify Functions, users live in MongoDB Atlas (D-001) next to `roadmap_progress`.
- Clerk is used today in: `src/frontend/main.tsx` (`ClerkProvider`), `src/frontend/layouts/SiteLayout.tsx` (`Show`, `UserButton`), `src/frontend/pages/Auth/SignInPage.tsx`, `src/frontend/pages/Roadmap/CourseRoadmapPage.tsx` and `RoadmapProgressView.tsx` (`useAuth().getToken`), `src/backend/functions/progress.ts` (`verifyToken` from `@clerk/backend`), `package.json`, `.env.example`, `docs/auth-setup.md`, `docs/architecture.md`, `docs/decisions.md`.
- TASK-009 (roadmap progress) is in progress on top of Clerk; this task swaps its identity layer and keeps its acceptance criteria valid.

## Scope
- In:
  - Remove `@clerk/backend`, `@clerk/react`, every Clerk import/component/hook, and `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES` from code, `.env.example` and docs.
  - Backend (Netlify Functions, D-007 layering): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/logout`.
  - `users` collection in Atlas: `email` (lowercased, unique index), `passwordHash` (optional), `googleSub` (optional, unique sparse index), `name`, `createdAt`, `updatedAt`.
  - Passwords hashed with bcrypt (`bcryptjs`, cost 12; see Notes). Input validated with shared Zod schemas in `src/shared/schemas/auth.ts`, used by both the frontend forms and the backend.
  - Google: frontend uses `@react-oauth/google`; backend verifies the ID token with `google-auth-library` (`verifyIdToken`, `audience = GOOGLE_CLIENT_ID`) and uses only claims from the verified token (`sub`, `email`, `email_verified`, `name`). If the verified email matches an existing user, link `googleSub` to that user.
  - Session: HS256 JWT (`sub` = user id, `exp` = 7 days) in a cookie `session` with `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`. `withAuth` reads the cookie, verifies the JWT and passes the user id to the handler. Logout clears the cookie.
  - Switch `progress.ts` from Clerk bearer tokens to `withAuth` (cookie); owner id = our user id.
  - Frontend: `/login` and `/register` pages (replacing `/sign-in`, `/sign-up`; old paths redirect), "Continue with Google" button on both, `AuthProvider` + `useAuth()` (`user`, `status`, `register`, `login`, `loginWithGoogle`, `logout`) backed by `/api/auth/me`, a `ProtectedRoute` that redirects to `/login?redirect=<path>`, header shows signed-in email + Sign out.
  - Env: `VITE_GOOGLE_CLIENT_ID` (frontend), `GOOGLE_CLIENT_ID`, `JWT_SECRET` (backend), keeping the existing `MONGODB_URI` / `MONGODB_DB_NAME` instead of `DATABASE_URL` (see Notes). Validate backend env with Zod at startup. `.env.example` updated; `.env` stays git-ignored.
  - Dev wiring: Vite `server.proxy` for `/api` so the app at `http://localhost:5173` calls the functions; CORS allowlist (`ALLOWED_ORIGINS`, credentials allowed) for any cross-origin caller.
  - Docs: rewrite `docs/auth-setup.md` (Google Cloud Console OAuth Client ID steps incl. Authorized JavaScript origins `http://localhost:5173`, and the commands to run frontend + backend locally); update `docs/architecture.md`; mark D-008 superseded.
- Out:
  - Email verification, password reset, "forgot password" and change-password flows.
  - Username sign-in (D-008 had it; only email + Google here).
  - Login rate limiting / lockout (D-007 puts it in Mongo `usage`; separate task).
  - Server-side session revocation (token denylist) and refresh tokens.
  - Migrating existing Clerk users or their `roadmap_progress` records.
  - Other OAuth providers; MCP OAuth (Module 7).
  - Netlify production env configuration and deploy-preview checks (TASK-005).

## Acceptance criteria
- [ ] Given the repo after this task, when searching source, `package.json`, `package-lock.json`, `.env.example` and docs (except decision history), then no `@clerk/*` package, Clerk import, or `CLERK_*` / `VITE_CLERK_*` variable remains.
- [ ] Given a new email and a valid password (8–72 chars), when the visitor registers, then a user is stored with a bcrypt hash (never the plain password), a `session` cookie is set, and they land signed in.
- [ ] Given an email that is already registered, when someone registers with it, then the API returns 409 and no second user is created.
- [ ] Given invalid input (bad email, short/over-long password, missing fields, non-JSON body), when submitted, then the form shows field errors before sending, and the API independently returns 400 without touching the database.
- [ ] Given a registered user, when they log in with the right password, then the session cookie is set; with a wrong password or unknown email, then the API returns 401 with the same generic message for both.
- [ ] Given a Google credential, when it is posted to `/api/auth/google`, then the backend verifies it with `google-auth-library` against `GOOGLE_CLIENT_ID`; a forged, expired or wrong-audience token returns 401, and any user id/email sent alongside the token in the body is ignored.
- [ ] Given a verified Google account whose email (with `email_verified: true`) matches an existing email/password user, when they continue with Google, then they are signed in as that same user and `googleSub` is stored on it; no duplicate user is created. With `email_verified: false`, no linking happens and the request is rejected.
- [ ] Given a signed-in browser, when it calls `GET /api/auth/me`, then it gets `{ id, email, name }` (no hash); without or with an invalid/expired cookie it gets 401.
- [ ] Given a signed-in browser, when it calls `POST /api/auth/logout`, then the cookie is cleared (`Max-Age=0`) and a following `/api/auth/me` returns 401.
- [ ] Given the session cookie is issued, when inspecting the `Set-Cookie` header, then it has `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and the JWT is never readable from JavaScript or stored in `localStorage`.
- [ ] Given a signed-out visitor, when they open a `ProtectedRoute`, then they are redirected to `/login?redirect=<path>` and returned to that path after signing in; public pages (lessons, roadmaps) stay reachable signed out.
- [ ] Given the TASK-009 progress API, when called with the session cookie, then progress is read/written for the cookie's user only; without a valid cookie it returns 401 and writes nothing.
- [ ] Given a production build, when searching `dist/` for `JWT_SECRET`, `MONGODB_URI` values or any non-`VITE_` variable, then nothing is found; `VITE_GOOGLE_CLIENT_ID` is the only auth variable in the bundle.
- [ ] Given the dev setup in `docs/auth-setup.md`, when following it with a real Google OAuth client, then email/password and Google sign-in both work from `http://localhost:5173`.
- [ ] `npm run verify` passes.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `grep -ri clerk` over `src/`, `package.json`, `.env.example`, `docs/` (excluding decisions history) | No matches | build |
| 2 | Register `a@x.io` / valid password | 201, user doc has `passwordHash` starting `$2`, `Set-Cookie: session=…` | unit (service + mocked repo) |
| 3 | Register same email twice (also with different casing `A@X.io`) | Second call 409; one user | unit |
| 4 | Register with `not-an-email`, 7-char password, 73-char password, `{}` body, non-JSON body | 400 each; repository not called | unit |
| 5 | Shared Zod schema with the same invalid inputs on the Register/Login forms | Field errors shown; no `fetch` | component |
| 6 | Login correct password / wrong password / unknown email | 200 + cookie / 401 / 401 with identical body | unit |
| 7 | `/api/auth/google` with token whose `verifyIdToken` throws (forged, expired, wrong audience) | 401, no user created | unit (mock `OAuth2Client`) |
| 8 | Google token valid; body also contains `email: "victim@x.io"`, `userId` | Body extras ignored; user resolved only from verified claims | unit |
| 9 | Google verified email matches existing password user | Same user id returned; `googleSub` set; user count unchanged | unit |
| 10 | Google token with `email_verified: false` | 401/403; no link, no user | unit |
| 11 | Same Google `sub` signs in twice | Same user both times | unit |
| 12 | `/api/auth/me` with valid cookie / no cookie / tampered JWT / expired JWT | 200 `{id,email,name}` / 401 / 401 / 401 | unit (`withAuth`) |
| 13 | Logout then `/me` | `Set-Cookie` with `Max-Age=0`; `/me` 401 | unit |
| 14 | Inspect `Set-Cookie` on login | `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800` | unit |
| 15 | Render `ProtectedRoute` signed out / signed in | Redirect to `/login?redirect=…` / child renders | component |
| 16 | `useAuth` on mount with `/me` 200 and 401 | `status` becomes `signed-in` with user / `signed-out` | component |
| 17 | Progress GET/PUT with cookie for user A, then as user B | Each sees only own records; no cookie → 401 | unit |
| 18 | Backend starts with missing/short `JWT_SECRET` or missing `GOOGLE_CLIENT_ID` | 503 "not configured", no crash, no secret in logs | unit |
| 19 | `npm run build` then grep `dist/` for secret values and non-`VITE_` env names | No matches | build/security |
| 20 | Request from an origin not in `ALLOWED_ORIGINS` | No `Access-Control-Allow-Origin` header | unit |
| 21 | Follow `docs/auth-setup.md`: register, logout, login, Continue with Google (new + linking), reload, roadmap progress | All work at `http://localhost:5173`; cookie survives reload | manual |

## Notes
- D-009 accepted 2026-10-11 when implementation was requested.
- **DB / env naming:** the request asked for `DATABASE_URL`; the repo already uses `MONGODB_URI` + `MONGODB_DB_NAME` for Atlas, so those stay. Rename only if you want the name to match the request.
- **bcrypt package:** `bcryptjs` (pure JS) instead of native `bcrypt`, so Netlify's esbuild bundling needs no `external_node_modules` and there is no native build step. Same algorithm and `$2` hash format. bcrypt only uses the first 72 bytes, hence the 72-char max.
- **JWT library:** `jose` (ESM, no native deps). `JWT_SECRET` ≥ 32 random chars, validated by Zod; generate with `openssl rand -base64 48`.
- **Account-linking risk:** without email verification, someone could register a victim's email with a password before the victim ever uses Google; linking would then leave the attacker's password working on the victim's account. Mitigation in scope: when linking Google to a user whose email was never verified, clear `passwordHash` and set `emailVerified: true` (the Google identity proves ownership). The owner can still use Google; password login for that account needs the future reset flow.
- **CSRF:** `SameSite=Lax` blocks cross-site POSTs carrying the cookie; additionally, state-changing endpoints require `Content-Type: application/json` and, when an `Origin` header is present, an origin in `ALLOWED_ORIGINS`.
- **`Secure` on localhost:** current Chrome and Firefox accept `Secure` cookies on `http://localhost`, so the flag stays on in dev. If a browser drops it, check this first.
- **Dev topology:** `netlify dev` (port 8888) runs the functions and starts Vite on 5173 (`netlify.toml [dev]`). Vite proxies `/api` → `http://localhost:8888`, so the browser at 5173 is same-origin with the API and needs no CORS in dev. Add both `http://localhost:5173` and `http://localhost:8888` to Google's Authorized JavaScript origins. Verified 2026-10-11: through the proxy `/api/auth/me` → 401 and invalid register → 400; an unknown `/api/*` path falls through to the SPA `index.html` (200), no loop.
- **Logout is stateless:** the JWT stays valid until `exp` if copied elsewhere; acceptable for now (revocation is Out). Keep `exp` at 7 days.
- **Protected routes:** lessons and roadmaps stay public (TASK-009 criterion). `ProtectedRoute` is applied to a minimal `/account` page so the redirect flow is real and testable; roadmap progress controls keep prompting "Sign in to track progress".
- **Existing data:** `roadmap_progress` records keyed by Clerk user ids become unreachable; dev data only, no migration.
- `.env` and `.env.example` cannot be read by Claude (`.claude/settings.json` denies `Read(./.env*)`), so both are updated by hand; the variables are listed in `docs/auth-setup.md`.
- Run tests with Node 24 (`nvm use`); under Node 20 jsdom fails to start.
- Pre-existing, not caused by this task: `HomePage.test.tsx` renders a `<Link>` without a router and fails; `RoadmapProgressView.tsx` has 3 type errors (readonly manifest tuples) and a `react-hooks/set-state-in-effect` lint error; `content/` lab code has lint errors. `npm run verify` stays red until those are fixed.
- Deliverables at the end of implementation (in `docs/auth-setup.md` and the PR): Google Cloud Console steps to create the OAuth Client ID, and the commands to run frontend + backend.
