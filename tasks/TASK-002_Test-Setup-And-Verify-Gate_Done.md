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
- In: Vitest (config in `vite.config.ts`, two `test.projects`); React Testing Library + jsdom for `src/frontend/` tests; Node environment for `src/backend/` (functions, scripts, MCP) and `src/shared/` tests; test file convention `*.test.ts(x)` next to the code; scripts `test` (single run), `test:watch`, `verify` = `lint && typecheck && test`; one smoke test for the placeholder home page; one backend test that proves the Node environment
- Out: coverage thresholds (add when there is real code to cover); E2E/Playwright; GitHub Actions (Module 6)

## Acceptance criteria
- [x] Given the scaffold, when I run `npm run verify`, then lint, typecheck and tests all run and it exits 0
- [x] Given a deliberately failing test, when I run `npm run verify`, then it exits non-zero and names the failing test
- [x] Given a type error in `src/`, when I run `npm run verify`, then it exits non-zero before tests run
- [x] Given a test under `src/backend/`, when tests run, then it runs in the Node environment (not jsdom)

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `npm run verify` on clean scaffold | exit 0; home page test passes | manual |
| 2 | add `expect(1).toBe(2)` to a test, run verify | exit ≠ 0, test named in output | manual |
| 3 | add `const x: number = "a"` in `src/`, run verify | exit ≠ 0 at typecheck | manual |
| 4 | `HomePage.test.tsx`: render `<HomePage />` | heading "aws.io.vn" is in the document | unit |
| 5 | `src/backend/runtime.test.ts` | no `window`/`document` on `globalThis`; output lists it under the `backend` project | unit |
| 6 | copy the backend test into `src/frontend/`, run tests | the copy fails (`window` is defined in jsdom) | manual |

## Notes
- D-006 accepted 2026-10-04 (option b). Ready to start.
- Choices made at the ready-check (2026-10-04):
  - `src/shared/` tests run in Node only. Shared code must not touch the DOM, and Node fails loudly if it does.
  - Vitest config lives in `vite.config.ts` as `test.projects` (`frontend`, `backend`), each with `extends: true` so the React plugin and `@shared` alias are inherited.
  - Explicit `import { describe, it, expect } from 'vitest'`, no `globals: true`; the frontend setup file calls `afterEach(cleanup)` itself.
- Vite `root` is `src/frontend`, so each project must point its `include` at the repo root, or backend tests are silently not found.
- Needs Node ≥ 22 (Vitest 5, jsdom 30): run `nvm use` first.
- Verified 2026-10-04 on Node 24.21.0, Vitest 5.0.3: all 6 test cases pass. TC1: verify exits 0, verbose output shows `|frontend|` and `|backend|`; TC2: exit 1, `FAIL |frontend| … > HomePage > shows the site heading`; TC3: exit 2 at `tsc -b`, Vitest never starts; TC6: the copy fails in jsdom (`'window' in globalThis` is true). `npm run build` output unchanged (no test files in `dist/`).
- Found while writing the backend test: `typeof window` is a type error under `tsconfig.node.json` (no DOM lib), so the test checks `'window' in globalThis`. The tsconfig split already blocks DOM names in backend code.
- Cosmetic: Vitest's `RUN` banner prints `src/frontend` (Vite's root); the projects themselves use the repo root.
