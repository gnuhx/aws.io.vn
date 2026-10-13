---
id: TASK-018
type: chore
module: none
decisions: [D-006]
created: 2026-10-13
---

# TASK-018: Fix the verify gate so it is green on a clean checkout

## Goal
`npm run verify` passes on every machine with the right Node version, so it can be trusted as the single gate for Netlify and CI.

## Context
Investigation on 2026-10-13 found verify red for three reasons unrelated to app code:
1. `eslint .` checks sample code inside `content/` (e.g. `content/MCP/Module 5/.../create-reader.js`): 15 errors. `eslint src` passes.
2. `src/frontend/pages/Auth/AuthPage.test.tsx` reads the developer's real `.env`: with `VITE_GOOGLE_CLIENT_ID` set, the Google button renders without `GoogleOAuthProvider` and 3 tests fail. In a clean environment they pass.
3. The default shell Node is 20; jsdom tests crash there (`markAsUncloneable`, see `.claude/lessons/vitest-node-20-webidl-markasuncloneable.md`). `package.json` says `node >=24` but nothing enforces it.

## Scope
- In: add `content` to `globalIgnores` in `eslint.config.js`; pin frontend test env so `.env` can't leak in (`test.env` in the frontend Vitest project, or mock `src/frontend/auth/config.ts`); add `.npmrc` with `engine-strict=true`
- Out: new tests; CI workflow (TASK-019)

## Acceptance criteria
- [ ] Given Node 24 and a `.env` with a real `VITE_GOOGLE_CLIENT_ID`, when I run `npm run verify`, then it exits 0
- [ ] Given lesson sample code in `content/` with lint errors, when I run `npm run lint`, then those files are not checked
- [ ] Given Node 20, when I run `npm ci`, then it fails with a clear engine error

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `npm run verify` with local `.env` | exit 0, 219 tests pass | manual |
| 2 | `npm run lint` | 0 errors, `content/` not listed | manual |
| 3 | `nvm use 20 && npm ci` | engine error | manual |
| 4 | AuthPage tests with `VITE_GOOGLE_CLIENT_ID=x` exported | still pass | unit |

## Notes
- Smallest and most urgent: every other test task depends on a green gate.
