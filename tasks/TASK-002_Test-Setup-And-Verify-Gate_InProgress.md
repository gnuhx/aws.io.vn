---
id: TASK-002
type: chore
module: none             # Release 0.1 (walking skeleton)
decisions: [D-006]
created: 2026-10-02
---

# TASK-002: Test setup and verify gate

## Goal
Add a unit/component test setup and one `npm run verify` command that every build runs, so broken code fails fast locally and on Netlify.

## Context
D-006 (test strategy). Depends on TASK-001. `verify` is reused by Netlify (TASK-005) and by GitHub Actions CI in Module 6.

## Scope
- In: Vitest; React Testing Library + jsdom for components; Node environment for `src/backend/` tests (functions, scripts, MCP); test file convention `*.test.ts(x)` next to the code; scripts `test` (single run), `test:watch`, `verify` = `lint && typecheck && test`; one smoke test for the placeholder home page
- Out: coverage thresholds (add when there is real code to cover); E2E/Playwright; GitHub Actions (Module 6)

## Acceptance criteria
- [ ] Given the scaffold, when I run `npm run verify`, then lint, typecheck and tests all run and it exits 0
- [ ] Given a deliberately failing test, when I run `npm run verify`, then it exits non-zero and names the failing test
- [ ] Given a type error in `src/`, when I run `npm run verify`, then it exits non-zero before tests run
- [ ] Given a test under `src/backend/`, when tests run, then it runs in the Node environment (not jsdom)

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `npm run verify` on clean scaffold | exit 0; home page test passes | manual |
| 2 | add `expect(1).toBe(2)` to a test, run verify | exit ≠ 0, test named in output | manual |
| 3 | add `const x: number = "a"` in `src/`, run verify | exit ≠ 0 at typecheck | manual |
| 4 | `App.test.tsx`: render `<App />` | placeholder heading is in the document | unit |

## Notes
- Blocked by D-006 (Proposed).
