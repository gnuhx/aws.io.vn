---
id: TASK-020
type: chore
module: none
decisions: [D-006]
created: 2026-10-13
---

# TASK-020: Coverage report and minimum thresholds

## Goal
See which code has no tests, and fail CI when coverage drops below an agreed floor, so untested new code is noticed without having to remember.

## Context
TASK-002 deferred coverage "until there is real code to cover". There now is (auth, progress, reading, profile). Depends on TASK-018; reported in CI by TASK-019.

## Scope
- In: `@vitest/coverage-v8`; `npm run test:coverage`; thresholds per folder (proposal: `src/shared/**` 90%, `src/backend/services/**` 80%, `src/backend/functions/**` 80%, `src/frontend/**` 60%); exclude test files, `main.tsx`, `*.module.css`; text summary in the CI log, HTML report as a CI artifact
- Out: coverage badges; coverage for `repositories/` (comes with TASK-021)

## Acceptance criteria
- [x] Given `npm run test:coverage`, when it finishes, then a per-file summary prints and `coverage/` has an HTML report
- [x] Given a new service file with no tests, when coverage runs, then it fails below the threshold and names the folder
- [x] Given CI, when the job finishes, then the HTML report is downloadable from the run

## Test cases
| # | Input / action | Expected result | Type | Result |
|---|---|---|---|---|
| 1 | run coverage on current code | passes at the agreed floor | manual | pass: 219 tests; 81.96% line coverage; HTML report generated |
| 2 | add an untested `services/dummy.ts` | fails, names the threshold | manual | pass: failed at `../backend/services/**` per-file threshold; probe removed |
| 3 | CI run completes | coverage artifact is downloadable | manual | pass: [CI run](https://github.com/gnuhx/aws.io.vn/actions/runs/38532558798) uploaded unexpired `coverage-report` artifact |

## Notes
- 2026-10-14 baseline: 219 tests pass; source coverage is 81.96% lines overall. Repositories and their coverage are excluded for TASK-021.
- Thresholds use lines, based on measured floors: shared is 100% (95% aggregate and per file); services aggregate is 93.59%, with `services/auth/index.ts` lowest at 50% (90% aggregate and 45% per file); functions aggregate is 96.91%, with a 90% lowest file (95% aggregate and 85% per file); frontend aggregate is 78.05% (75% aggregate). These floors sit just below baseline and can be raised over time.
- `npm run test:coverage` prints the per-file text report and writes HTML/JSON reports to ignored root `coverage/`. The V8 provider is version-aligned with Vitest.
- `npm ci`, lint, typecheck and build pass on Node 24.21.0.
- Verified that adding a temporary untested `src/backend/services/coverage-probe.ts` makes coverage fail at the 45% per-file floor and names the `../backend/services/**` threshold; the probe was removed afterward.
- CI runs `npm run test:coverage` and uploads `coverage/` as the `coverage-report` artifact for 14 days, including on test failure. Verified in run 38532558798; the artifact is available and unexpired.
