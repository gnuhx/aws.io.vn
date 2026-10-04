---
id: TASK-001
type: chore
module: none             # Release 0.1 (walking skeleton)
decisions: [D-003, D-005]
created: 2026-10-02
---

# TASK-001: Scaffold project

## Goal
Create an empty but runnable React + Vite + TypeScript project, with all source code under `src/` split into `frontend/`, `backend/` and `shared/`, so every later task has a working base.

## Context
docs/architecture.md (repository structure), D-003 (repo shape), D-005 (frontend libraries). Requires the Module 0 environment: Node LTS via nvm.

## Scope
- In: Vite React TS app with Vite root `src/frontend/` (build output `dist/` at repo root); empty `src/backend/functions/` and `src/shared/` (`.gitkeep`); React Router with a placeholder home page (`src/frontend/pages/Home/`); CSS Modules; ESLint (flat config; browser globals for `src/frontend`, Node for `src/backend`; `frontend` ↔ `backend` imports forbidden) + Prettier; `tsconfig.json` referencing `tsconfig.app.json` (`src/frontend` + `src/shared`, DOM) and `tsconfig.node.json` (`src/backend` + `src/shared` + `vite.config.ts`, Node); alias `@shared/*` in tsconfig and Vite; single root `package.json`; npm scripts `dev`, `build`, `preview`, `lint`, `format`, `typecheck`; `.gitignore` (`node_modules`, `dist`, `.env*`, `.netlify`, `CLAUDE.local.md`, `.claude/settings.local.json`); `.nvmrc` with the current Node LTS; minimal `.claude/settings.json` denying `Read(./.env*)`
- Out: tests (TASK-002), lesson pages (TASK-003), functions (TASK-004), `netlify.toml` (TASK-005), `CLAUDE.md` (Module 2)

## Acceptance criteria
- [x] Given a fresh clone, when I run `nvm use && npm ci && npm run dev`, then the placeholder home page loads at localhost
- [x] Given the scaffold, when I run `npm run lint` and `npm run typecheck`, then both exit 0 with no warnings
- [x] Given the scaffold, when I run `npm run build`, then `dist/` contains `index.html` and hashed assets
- [x] Given a file `.env` exists, when I run `git status`, then it is not listed
- [x] Given Claude Code in this repo, when it is asked to read `.env`, then the read is denied

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `npm ci && npm run dev`, open the URL | placeholder page renders, no console errors | manual |
| 2 | `npm run lint && npm run typecheck` | exit 0 | manual |
| 3 | `npm run build` | `dist/index.html` exists | manual |
| 4 | `touch .env && git status --short` | `.env` not shown | manual |
| 5 | ask Claude "read .env" | permission denied | manual |

## Notes
- D-003 (option d) and D-005 accepted 2026-10-03. Ready to start.
- Verified 2026-10-03 on Node 24.21.0: all 5 test cases pass. TC1 checked in headless Chrome (page renders, console has only Vite/React info messages, no errors); TC2–3 also pass from a fresh clone with `npm ci`; TC5: Claude's Read tool is refused by `.claude/settings.json`.
- Follow-up (Module 3): the deny rule covers Claude's Read tool only; shell commands such as `cat .env` are not blocked yet.
- Installed majors differ from the old template: React Router 8, TypeScript 6, Vite 8, ESLint 10 (ESLint kept over the template's new default, oxlint).
