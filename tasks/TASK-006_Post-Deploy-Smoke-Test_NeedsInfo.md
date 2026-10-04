---
id: TASK-006
type: feature
module: none             # Release 0.1 (walking skeleton)
decisions: [D-006]
created: 2026-10-02
---

# TASK-006: Post-deploy smoke test

## Goal
Automatically check every finished deploy (preview and production) with a few real HTTP requests, so a deploy that builds but doesn't work is caught within minutes.

## Context
D-006. Depends on TASK-005. Unit tests (TASK-002) catch code errors before deploy; this catches config errors after it (redirects, functions missing, wrong publish dir).

## Scope
- In: `src/backend/scripts/smoke.ts <baseUrl>` (run with `tsx`) checking: `/` → 200 HTML; one known lesson URL → 200; `/api/health` → 200 JSON with `ok: true`; an unknown deep link → app's not-found page (200 from SPA fallback, not Netlify's 404); `npm run smoke -- <url>` for manual runs; a GitHub Action triggered on `deployment_status` = success that runs the script against the deploy URL
- Out: browser E2E (Playwright, later); alerting beyond the GitHub check result; the broader CI workflow (Module 6)

## Acceptance criteria
- [ ] Given a healthy deploy URL, when I run `npm run smoke -- <url>`, then every check prints ✓ and it exits 0
- [ ] Given `/api/health` returns 500, when smoke runs, then that check prints ✗ with status and body, and it exits non-zero
- [ ] Given a Netlify deploy finishes, when GitHub receives the deployment status, then the smoke Action runs against that deploy's URL and its result shows on the commit/PR

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | smoke against a local mock server, all routes OK | exit 0 | unit |
| 2 | mock server returns 500 on `/api/health` | exit ≠ 0, failing check named | unit |
| 3 | `npm run smoke -- https://aws.io.vn` | all ✓ | manual |
| 4 | open a PR, wait for preview deploy | smoke check appears on the PR, green | manual |

## Notes
- Blocked by D-006 (Proposed).
- Verify against current docs: that Netlify's GitHub integration sends `deployment_status` events, and which field carries the deploy URL (`target_url` vs `environment_url`).
- This pulls one small GitHub Action forward from Module 6. Module 6 still adds PR CI and the Claude Action.
