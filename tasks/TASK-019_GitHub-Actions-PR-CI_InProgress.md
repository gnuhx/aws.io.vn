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
- Target ≤ 3 min per run.
- 2026-10-14: Pulled PR CI forward from Module 6; D-006 amended. TASK-018 is Done, so lint now excludes `content/`.
- `.github/workflows/ci.yml` is already committed: PRs and pushes to `main`/`development` run lint, typecheck, unit tests and build with Node from `.nvmrc`, npm cache and read-only token. The verify job's check name is `CI / verify`.
- Remaining: configure `main` branch protection to require `CI / verify`, then confirm the check appears on a PR. This workspace has no `gh` executable, so the GitHub repository setting cannot be changed here.
- 2026-10-14 verification: Node 24.21.0 `npm run verify` passed (lint, typecheck, 219/219 tests); `npm run build` passed including env and bundle checks. GitHub Actions run 38432071092 for `development` SHA `46cbe955d4cc6351236375204a007dde0f404947` passed all steps. That SHA is also the head of open PR #5; no `pull_request` event run exists yet. GitHub's unauthenticated API refuses access to branch protection settings (401), so that acceptance criterion remains unverified.
- 2026-10-13: Previous local check on a clean checkout of 5076b4b with no `.env` reported build passing and 216/216 tests passing. This predates TASK-018.
