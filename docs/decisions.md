# Decisions

Why things are the way they are. Newest first.

- **Status:** Proposed → Accepted | Rejected | Superseded by D-xxx
- Never delete an entry. To reverse a decision, add a new one that says `Supersedes D-xxx`.
- Keep rejected ideas: "why didn't we do X?" is the question you'll ask most.
- A decision is never coded directly. Once accepted, create task files in [tasks/](../tasks/) and list their IDs under **Tasks**.

Template:

```md
## D-xxx · YYYY-MM-DD · Proposed
**Question:** What needs deciding?
**Options:** (a) ...; (b) ...
**Decision:** _open_ | which option, and the evidence for it
**Consequences:** what this changes (docs, schema, roadmap steps)
**Tasks:** TASK-012, TASK-013 | —
```

---

## D-007 · 2026-10-03 · Accepted
**Question:** How is backend code organised inside `src/backend/`? Netlify Functions are one file per endpoint; where do business logic, database access, auth and external clients live?
**Options:** (a) helpers inside the functions folder (`functions/_lib/`), as first sketched; (b) layered folders next to `functions/`: thin endpoints in `functions/`, composable wrappers in `middleware/`, logic in `services/`, MongoDB access in `repositories/`, SDK clients in `clients/`; (c) one Express app wrapped in a single Netlify Function (`serverless-http`)
**Decision:** **(b)**, accepted 2026-10-03.
- Keeps the functions folder for endpoints only. Netlify deploys what's in it, so helpers and tests in there risk being treated as functions.
- Same controller → service → repository layering as Express/NestJS, so the clean-code patterns carry over; services don't know about Netlify and could move to Express or AWS Lambda unchanged.
- Auth, rate limit and error handling are wrappers (`withAuth(handler)`), the serverless version of Express middleware, and are unit-testable on their own.
- (c) was rejected: it brings back a framework and router we don't need, makes cold starts slower, and hides per-endpoint config such as paths and timeouts.
**Consequences:**
- Dependency direction (one way only): `functions → middleware, services` · `services → repositories, clients` · `repositories → clients`. Nothing imports `functions/`. `scripts/` and `mcp/` call `services/` like a function does. Enforced by ESLint once there is code to enforce it on.
- Every endpoint is wrapped in `withAuth(...)` or explicitly marked public with `publicEndpoint(...)`; a test fails if a file in `functions/` has neither (default deny).
- Every input is parsed with a Zod schema from `src/shared/schemas/` before reaching a service.
- Clients (Mongo, OpenAI) are created once per module, outside the handler, and reused across invocations.
- Only endpoint files sit directly in `functions/`; their tests go in `functions/__tests__/` (TASK-004 verifies Netlify ignores that folder). All other backend tests sit next to their code.
- Rate limit/quota state lives in MongoDB (`usage`), never in memory: each invocation may be a fresh instance.
- `retrieve()` moves from `functions/_lib/rag/` to `services/retrieval/`; architecture.md and roadmap updated.
**Tasks:** TASK-004 (first endpoint follows this layout)

## D-006 · 2026-10-02 · Accepted
**Question:** How do we make sure nothing broken reaches production, before Module 6 adds GitHub Actions CI?
**Options:** (a) no automation until M6; (b) gate in the Netlify build: `npm run verify` (lint + typecheck + unit tests + content validation) runs before `vite build`, so a failure blocks the deploy; plus a post-deploy smoke test; (c) full GitHub Actions CI now
**Decision:** **(b)**, accepted 2026-10-04. Every deploy, preview or production, is gated with zero extra infrastructure. Smoke tests run from a small GitHub Action on Netlify's deployment status. M6 still teaches PR-level CI on top.
**Consequences:** test stack = Vitest + React Testing Library + jsdom; `npm run verify` is the single gate command used by Netlify now and by CI in M6; E2E (Playwright) deferred until there is UI worth clicking through
**Tasks:** TASK-002, TASK-005, TASK-006

## D-005 · 2026-10-02 · Accepted
**Question:** Frontend libraries not covered by the design: router, styling, lesson rendering
**Options:** router: React Router | TanStack Router; styling: plain CSS / CSS Modules | Tailwind; lessons: Markdown read at build time + react-markdown | MDX
**Decision:** **React Router + CSS Modules + react-markdown**, accepted 2026-10-03. Fewest new concepts; react-markdown is already planned for the chat in M2, so one renderer for both.
**Consequences:** fixes the component and file structure that `docs/conventions.md` describes in M2
**Tasks:** TASK-001, TASK-003

## D-004 · 2026-10-02 · Proposed
**Question:** How do we deploy?
**Options:** (a) Netlify Git-based continuous deploy (push → build → deploy, PRs get preview URLs); (b) manual `netlify deploy` from the laptop
**Decision:** _open_. Recommended: **(a)**. Previews per PR for free, nothing deploys that isn't in git, and the build gate (D-006) applies to every deploy.
**Consequences:** `main` = production; the Netlify site is linked to `gnuhx/aws.io.vn`; `aws.io.vn` DNS points to Netlify
**Tasks:** TASK-005

## D-003 · 2026-10-02 · Accepted
**Question:** Repo shape: single folder, or separate `client/` + `server/`?
**Options:** (a) single folder with `src/` + `netlify/functions/` + `shared/`; (b) `client/` + `server/`; (c) monorepo with workspaces; (d) one package like (a), but all source code under `src/`, split into `src/frontend/`, `src/backend/`, `src/shared/`
**Decision:** **(d)**, accepted 2026-10-03. Keeps the benefits of (a): Netlify builds one site from one repo, one `package.json`, `shared/` imports need no package linking, no workspaces. It also makes the frontend/backend split visible and keeps every line of source code in `src/`. The only cost: Netlify's functions dir is set to `src/backend/functions` instead of the default `netlify/functions` (one line in `netlify.toml`).
**Consequences:**
- Vite root = `src/frontend` (holds `index.html`), build output still `dist/` at repo root
- Two tsconfigs: `tsconfig.app.json` (frontend + shared, DOM types) and `tsconfig.node.json` (backend + shared, Node types), so using the wrong runtime's APIs is a type error
- ESLint forbids `frontend` ↔ `backend` imports; both may import `shared` via alias `@shared/*`
- Node tooling lives in `src/backend/` too: `scripts/` (ingest, evals, smoke) and `mcp/lesson-search/`, since they reuse backend code such as `retrieve()`
- Paths updated in [architecture.md](architecture.md), [roadmap.md](roadmap.md) and TASK-001…006; `CLAUDE.md` and Module 3 permission rules follow these paths
**Tasks:** TASK-001, TASK-004, TASK-005

## D-002 · 2026-10-02 · Proposed
**Question:** Does the site have login/users?
**Options:** (a) reuse existing auth; (b) add auth; (c) guests only, quota by IP hash
**Decision:** _open_. Recommended: **(c) for now**. The old site had no auth (frontend only, per its README), so there is nothing to reuse. Revisit before Module 7.
**Consequences:** decides how quota and attempt history work in Module 7
**Tasks:** —

## D-001 · 2026-10-02 · Proposed
**Question:** Is MongoDB Atlas or self-hosted?
**Options:** (a) Atlas (free M0 tier); (b) self-hosted
**Decision:** _open_. Recommended: **(a)**. `$vectorSearch` is an Atlas feature; M0 is free and enough for learning.
**Consequences:** if not Atlas, the `$vectorSearch` approach in Module 5 must change
**Tasks:** — (Module 4)
