# Sign-in and roadmap progress setup

The site has its own accounts (D-009): email + password, or Google. Users and roadmap progress live in MongoDB Atlas. Public lessons and roadmaps stay readable without an account.

## How it works

| Piece | Where |
|---|---|
| Login / Register pages, "Continue with Google" | `src/frontend/pages/Auth/AuthPage.tsx` (`/login`, `/register`) |
| `useAuth()`, `<AuthProvider>`, `<ProtectedRoute>` | `src/frontend/auth/` |
| Input rules (same for form and API) | `src/shared/schemas/auth.ts` |
| Endpoints | `src/backend/functions/auth-*.ts` → `/api/auth/{register,login,google,me,logout}` |
| Profile + password change (TASK-015) | `src/backend/functions/profile*.ts` → `/api/profile` (GET/PUT), `/api/profile/password` (POST); rules in `src/shared/schemas/profile.ts` |
| Passwords (bcrypt, cost 12), Google linking | `src/backend/services/auth/authService.ts` |
| Session JWT + cookie | `src/backend/services/auth/sessions.ts` |
| `withAuth` / `publicEndpoint`, CORS, CSRF checks | `src/backend/middleware/http.ts` |

- **Session:** an HS256 JWT (`sub` = user id, 7 days) in the `session` cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`. JavaScript never sees it; the frontend asks `GET /api/auth/me` who is signed in. Logout clears the cookie. Tokens are stateless, so a copied token stays valid until it expires.
- **Google:** the browser gets an ID token from Google Identity Services and posts only that token. The server verifies it with `google-auth-library` (signature, expiry, audience = `GOOGLE_CLIENT_ID`) and uses only the verified claims.
- **Account linking:** if Google's *verified* email matches an existing email/password account, Google is linked to that same user. Registration doesn't verify emails, so when an unverified account gets linked its password is removed: whoever set it may not own the email. That user signs in with Google from then on.
- **Avatar:** the verified token's `picture` (https only) is stored as `avatarUrl` and refreshed on every Google sign-in. There are no avatar uploads.
- **Password change:** accounts with a password must give the current one. Google-only accounts can set a first password without one. Other sessions stay valid until they expire (stateless JWT).
- **CSRF:** `SameSite=Lax`, plus every POST/PUT/DELETE must be `application/json` and, if the browser sends an `Origin`, come from this site or `ALLOWED_ORIGINS`.

## Environment

Put these in `.env` for local development (first time only: `cp -n .env.example .env`; plain `cp` would overwrite real values) and in Netlify's environment settings for deploys. `.env` is git-ignored. Only `VITE_` variables reach the browser bundle, so no secret may use that prefix.

| Variable | Side | Value |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | frontend | OAuth Client ID from Google Cloud (public). Without it the Google button is hidden. |
| `GOOGLE_CLIENT_ID` | backend | The same Client ID; the server checks tokens were issued for it. |
| `JWT_SECRET` | backend | At least 32 random characters: `openssl rand -base64 48`. Changing it signs everyone out. |
| `MONGODB_URI`, `MONGODB_DB_NAME` | backend | Atlas connection string and database name. |
| `ALLOWED_ORIGINS` | backend, optional | Comma-separated origins allowed to call the API cross-origin with cookies. Not needed when the site and API share an origin (local dev via the proxy, Netlify). |

The Clerk variables (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`) are no longer used; delete them from `.env` and Netlify.

## Create the Google OAuth Client ID

1. Open [Google Cloud Console](https://console.cloud.google.com/) and pick or create a project.
2. **APIs & Services → OAuth consent screen** (shown as **Google Auth Platform** in newer consoles): choose **External**, fill in the app name, support email and developer contact, and save. While the app is in **Testing**, add your Google account under **Test users** (Audience).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** (or **Google Auth Platform → Clients → Create client**).
4. Application type: **Web application**. Name it, e.g. `aws.io.vn web`.
5. **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost` (Google Identity Services recommends it for local testing)
   - `http://localhost:8888` (if you also open the site through `netlify dev`'s port)
   - later: `https://aws.io.vn` and any deploy-preview origin you sign in from
6. **Authorized redirect URIs:** leave empty. The Google button returns an ID token by popup; nothing redirects back.
7. Create, then copy the **Client ID** into both `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`. The Client secret is not used.

New origins can take a few minutes to start working. An "origin is not allowed" / `idpiframe_initialization_failed` error means the exact origin (scheme + host + port) is missing from step 5.

## Run locally

Use the Node version in `.nvmrc` (24). Node 20 cannot start the frontend tests (jsdom).

```bash
nvm use
npm install
npx netlify-cli dev        # runs the functions on :8888 and starts Vite on :5173
```

Open **http://localhost:5173**. Vite proxies `/api/*` to `netlify dev` on :8888, so the page and the API share an origin and the session cookie works without CORS. `netlify dev` also loads `.env` into the functions. `npm run dev` alone starts only the frontend: pages load but every `/api` call fails.

Don't open http://localhost:8888: `netlify dev` applies the `/* → /index.html` rewrite from `netlify.toml` to Vite's module requests there, and Vite shows "Failed to parse source for import analysis … index.html". Use :5173.

Checks: `npm run verify` (lint + typecheck + tests), `npm run build`.

`npm run build` (also on Netlify) runs build checks from `src/backend/build/buildChecks.ts` around `vite build`:

- `check:env` (before): Google Client IDs are well-formed (not the `.env.example` placeholder) and identical; Google actually knows the Client ID (skipped with a warning when offline, or with `SKIP_GOOGLE_CLIENT_CHECK=1`); `JWT_SECRET` ≥ 32 chars and a `mongodb://` / `mongodb+srv://` `MONGODB_URI` when set, and all backend variables present on Netlify (`NETLIFY=true`); no secret-looking `VITE_` variable.
- `check:bundle` (after): no `JWT_SECRET`, `MONGODB_URI` or `GOOGLE_CLIENT_SECRET` value appears in `dist/`.

A failing check stops the build and writes `.claude/lessons/<issue-id>.md` (what happened, how to fix; variable names only, never values). The file is refreshed each time the same check fails again.

## Atlas

The functions create their collections and indexes on first use:

- `users`: unique `email` (stored lower-case), unique `googleSub` when present. Fields: `email`, `passwordHash?`, `googleSub?`, `name?`, `emailVerified`, `createdAt`, `updatedAt`.
- `roadmap_progress`: unique `(userId, roadmapId, itemId)`; `userId` is the `users._id` from the verified session, never a value from the browser.

The Atlas database user needs read/write access to the selected database, and Atlas network access must permit the Netlify runtime. Use a restricted network policy where the deployment plan supports fixed egress; do not add a broad public allowlist for production. Progress saved under Clerk user ids is not migrated.

**Credential housekeeping:** the previous Atlas password was reported exposed. Rotate that database user's password in Atlas before putting a replacement into `.env` or Netlify. This repository setup does not read or reuse the ignored `atlas-credentials.env` file.

## Roadmap IDs

`src/shared/roadmapProgress.ts` is the checked-in progress manifest. IDs are assigned once by roadmap source order and are independent of checkbox wording and headings. When adding or removing a checklist item, update the manifest entry and its `sourceLine` lookup while preserving IDs for existing items.
