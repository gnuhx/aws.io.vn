---
id: TASK-001
type: chore
module: none             # Release 0.1 (walking skeleton)
decisions: [D-003, D-005]
created: 2026-10-02
---

# TASK-001: Scaffold project

## Goal
Create an empty but runnable React + Vite + TypeScript project in a single folder, so every later task has a working base.

## Context
docs/architecture.md (repository structure), D-003 (repo shape), D-005 (frontend libraries). Requires the Module 0 environment: Node LTS via nvm.

## Scope
- In: Vite React TS app in `src/`; empty `netlify/functions/` and `shared/`; React Router with a placeholder home page; CSS Modules; ESLint + Prettier; `tsconfig` covering `src/`, `netlify/`, `shared/`, `scripts/`; npm scripts `dev`, `build`, `preview`, `lint`, `format`, `typecheck`; `.gitignore` (`node_modules`, `dist`, `.env*`, `.netlify`, `CLAUDE.local.md`, `.claude/settings.local.json`); `.nvmrc` with the current Node LTS; minimal `.claude/settings.json` denying `Read(./.env*)`
- Out: tests (TASK-002), lesson pages (TASK-003), functions (TASK-004), `netlify.toml` (TASK-005), `CLAUDE.md` (Module 2)

## Acceptance criteria
- [ ] Given a fresh clone, when I run `nvm use && npm ci && npm run dev`, then the placeholder home page loads at localhost
- [ ] Given the scaffold, when I run `npm run lint` and `npm run typecheck`, then both exit 0 with no warnings
- [ ] Given the scaffold, when I run `npm run build`, then `dist/` contains `index.html` and hashed assets
- [ ] Given a file `.env` exists, when I run `git status`, then it is not listed
- [ ] Given Claude Code in this repo, when it is asked to read `.env`, then the read is denied

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `npm ci && npm run dev`, open the URL | placeholder page renders, no console errors | manual |
| 2 | `npm run lint && npm run typecheck` | exit 0 | manual |
| 3 | `npm run build` | `dist/index.html` exists | manual |
| 4 | `touch .env && git status --short` | `.env` not shown | manual |
| 5 | ask Claude "read .env" | permission denied | manual |

## Notes
- Blocked by D-003 and D-005 (Proposed). Rename to `_Ready` once both are accepted.
