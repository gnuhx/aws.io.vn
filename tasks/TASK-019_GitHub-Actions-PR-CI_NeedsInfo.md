---
id: TASK-019
type: chore
module: M6
decisions: [D-006]
created: 2026-10-13
---

# TASK-019: GitHub Actions CI on every PR and push

## Goal
Every PR shows a green/red check from lint, typecheck, tests and build before merge, so broken code never reaches `main` (not only blocked at Netlify deploy time).

## Context
D-006 chose the Netlify build gate now and PR-level CI in Module 6. TASK-005 (Netlify gate) is still NeedsInfo. Depends on TASK-018.

## Scope
- In: `.github/workflows/ci.yml` on `pull_request` and `push` to `main`/`development`: checkout → `setup-node` with `node-version-file: .nvmrc` + npm cache → `npm ci` → `npm run verify` → `npm run build` (NETLIFY unset, so backend env checks stay relaxed); test results visible in the job log; branch protection on `main` requiring the check
- Out: coverage (TASK-020); E2E (TASK-025); deploy from Actions (Netlify keeps deploying); Claude Action (Module 6)

## Acceptance criteria
- [ ] Given a PR, when it's opened or updated, then a `CI / verify` check runs and reports its result on the PR
- [ ] Given a PR with a failing test, when CI runs, then the check is red and names the failing test
- [ ] Given branch protection, when the check is red, then the PR can't be merged into `main`
- [ ] Given a cached run, when CI runs again, then `npm ci` reuses the npm cache

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | open PR with no changes | check green | manual |
| 2 | PR with `expect(1).toBe(2)` | check red, test named | manual |
| 3 | PR with type error | red at typecheck | manual |
| 4 | try to merge a red PR | blocked | manual |

## Notes
- Needs decision: pull this forward from Module 6 now, or wait? (amend D-006 if pulled forward)
- Needs decision: branch protection on `main` is a repo setting change on GitHub (outward-facing); do it yourself or allow me via `gh`.
- Target ≤ 3 min per run.
- 2026-10-13: `.github/workflows/ci.yml` drafted (lint → typecheck → test → build, Node from `.nvmrc`, npm cache, cancel superseded runs, read-only token). Checked locally on a clean checkout of 5076b4b with no `.env`: build passes, 216/216 tests pass. The Lint step will fail until TASK-018 ignores `content/`. Branch protection not set yet.
