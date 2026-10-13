---
id: TASK-023
type: chore
module: none
decisions: [D-007]
created: 2026-10-13
---

# TASK-023: Enforce backend layering automatically

## Goal
The D-007 dependency direction (functions → services → repositories → clients) is checked by lint/tests, so a shortcut like a function querying Mongo directly fails CI.

## Context
ESLint already blocks frontend ↔ backend imports, and `default-deny.test.ts` checks every endpoint is `withAuth`/`publicEndpoint`. Layer direction inside `src/backend/` is only documented (docs/architecture.md).

## Scope
- In: `no-restricted-imports` rules per backend folder: `functions/` may not import `repositories/` or `clients/`; `repositories/` may not import `services/`, `middleware/` or `functions/`; `services/` may not import `functions/` or `middleware/`; `clients/` imports nothing above it; a test that every function file exports `config.path` starting with `/api/`
- Out: refactoring existing violations beyond what the rules require (list them first)

## Acceptance criteria
- [ ] Given current code, when lint runs, then it passes (or violations are listed and fixed in this task)
- [ ] Given `functions/x.ts` importing `../repositories/progress.ts`, when lint runs, then it fails with a message naming D-007
- [ ] Given a new function without `config.path` under `/api/`, when tests run, then it fails naming the file

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | lint current code | pass | manual |
| 2 | add a forbidden import | lint error with D-007 message | manual |
| 3 | function without `/api/` path | test fails | unit |
