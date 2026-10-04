---
id: TASK-005
type: chore
module: none             # Release 0.1 (walking skeleton)
decisions: [D-004, D-006]
created: 2026-10-02
---

# TASK-005: Netlify deploy with build gate

## Goal
Deploy the site to Netlify from git, with tests gating every deploy, so `main` is always live at aws.io.vn and nothing that fails verify gets published.

## Context
D-004 (deploy method), D-006 (build gate). Depends on TASK-001…004. Check current Netlify docs: build settings, functions directory, redirects, Node version from `.nvmrc`.

## Scope
- In: `netlify.toml` with build command `npm run verify && npm run build`, publish `dist`, functions `src/backend/functions` (D-003), SPA fallback (`/* → /index.html 200`) without breaking `/api/*`; Netlify site linked to `gnuhx/aws.io.vn` with production branch `main` and deploy previews on PRs; `aws.io.vn` custom domain + HTTPS
- Out: environment variables/secrets (Module 4–5); post-deploy smoke test (TASK-006); GitHub Actions CI (Module 6)

## Acceptance criteria
- [ ] Given a push to `main`, when the Netlify build finishes, then https://aws.io.vn serves the new version
- [ ] Given a PR, when it's opened, then Netlify posts a deploy preview URL on it
- [ ] Given a commit with a failing test, when Netlify builds it, then the build fails and the previous deploy stays live
- [ ] Given a deep link like `/aws-saa-c03/01-iam-intro`, when I open it directly (not via in-app navigation), then the page loads (no 404)
- [ ] Given production, when I open `/api/health`, then it returns 200 JSON (the SPA fallback didn't swallow it)

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | push to `main` | deploy succeeds, site updated | manual |
| 2 | open a PR | preview URL appears | manual |
| 3 | PR with `expect(1).toBe(2)` | Netlify build fails at verify; production unchanged | manual |
| 4 | hard-refresh a lesson URL in production | lesson renders | manual |
| 5 | `curl https://aws.io.vn/api/health` | 200 JSON | manual |

## Notes
- Blocked by D-004 and D-006 (Proposed).
- DNS change for aws.io.vn is outward-facing; do it once the preview works.
- After this task: tag `v0.1`.
