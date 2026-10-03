---
id: TASK-004
type: feature
module: none             # Release 0.1 (walking skeleton)
decisions: [D-003]
created: 2026-10-02
---

# TASK-004: API health function

## Goal
Add the first backend endpoint, `GET /api/health`, and show its status on the site, to prove the frontend → Netlify Functions path works locally and in production.

## Context
docs/architecture.md (backend = Netlify Functions), D-003. Depends on TASK-001, TASK-002. Check current Netlify docs for the function format (modern functions can declare their own `/api/...` path).

## Scope
- In: `src/backend/functions/health.ts` returning `{ ok: true, version, time }` (`version` = short git commit from the build env, or `"dev"`); a footer badge in the app calling `/api/health` (shows "API ok" / "API down"); local run via `netlify dev`
- Out: MongoDB/OpenAI checks in health (Module 4–5); auth; rate limiting (Module 7)

## Acceptance criteria
- [ ] Given `netlify dev` running, when I `curl /api/health`, then I get HTTP 200 and JSON with `ok: true`, `version`, `time`
- [ ] Given the API responds, when the page loads, then the footer shows "API ok"
- [ ] Given the API fails or is unreachable, when the page loads, then the footer shows "API down" and the rest of the page still works

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | call the handler directly with a `GET` Request | status 200, body has `ok: true`, `version`, ISO `time` | unit |
| 2 | handler with no commit env var | `version: "dev"` | unit |
| 3 | footer with mocked fetch → 200 | "API ok" shown | component |
| 4 | footer with mocked fetch → network error | "API down" shown, no crash | component |
| 5 | `netlify dev`, `curl localhost:8888/api/health` | 200 JSON | manual |

## Notes
- D-003 accepted 2026-10-03 (functions live in `src/backend/functions/`). Still waits on TASK-001 and TASK-002.
- Check that Netlify's function bundler resolves the `@shared/*` alias; if not, use relative imports.
- Needs the `netlify` CLI (Module 0).
