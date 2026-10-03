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

## D-006 · 2026-10-02 · Proposed
**Question:** How do we make sure nothing broken reaches production, before Module 6 adds GitHub Actions CI?
**Options:** (a) no automation until M6; (b) gate in the Netlify build: `npm run verify` (lint + typecheck + unit tests + content validation) runs before `vite build`, so a failure blocks the deploy; plus a post-deploy smoke test; (c) full GitHub Actions CI now
**Decision:** _open_. Recommended: **(b)**. Every deploy, preview or production, is gated with zero extra infrastructure. Smoke tests run from a small GitHub Action on Netlify's deployment status. M6 still teaches PR-level CI on top.
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
