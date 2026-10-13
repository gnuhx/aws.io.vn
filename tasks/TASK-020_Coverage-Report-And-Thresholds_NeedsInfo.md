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
- [ ] Given `npm run test:coverage`, when it finishes, then a per-file summary prints and `coverage/` has an HTML report
- [ ] Given a new service file with no tests, when coverage runs, then it fails below the threshold and names the folder
- [ ] Given CI, when the job finishes, then the HTML report is downloadable from the run

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | run coverage on current code | passes at the agreed floor | manual |
| 2 | add an untested `services/dummy.ts` | fails, names the threshold | manual |

## Notes
- Needs decision: threshold numbers. Measure the current baseline first, then set the floor slightly below it and raise over time (ratchet), rather than a big target number.
