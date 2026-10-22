---
id: TASK-028
type: chore
module: none
decisions: []
created: 2026-10-22
---

# TASK-028: Hide Terraform content until it is ready

## Goal
`content/Terraform/` can be committed without a broken "Terraform" topic appearing on the website.

## Context
`src/frontend/content.ts` loads every `content/**/*.md` through `rawContentModules`, so any new course folder is published automatically. The Terraform folder does not fit the loader yet (see TASK-030): lesson slugs collide, ordering is wrong, images break and the open-iconic READMEs under `Code Files/` would become lessons.

Release plan for the Terraform course: TASK-028 → TASK-029 → TASK-030 → TASK-031 → TASK-032 → TASK-033.

## Scope
- In: Add `'!../../content/Terraform/**'` to the `rawContentModules` glob; add a test asserting no `Terraform` topic is in the catalog.
- Out: Any loader support for the Terraform layout (TASK-030).

## Acceptance criteria
- [x] Given `content/Terraform/` exists, when the site builds, then `getTopics()` has no Terraform topic and the home page is unchanged.
- [x] `npm run build` and the test suite pass (Node 24: 260 tests, lint, typecheck, build + bundle check; no Terraform text in `dist/`).

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `getLessonCatalog()` | No key `Terraform` / `terraform` | unit |
| 2 | Build | No Terraform markdown in the bundle | manual |

## Notes
Removed again in TASK-033 when the course is released.
- 2026-10-22: Folder renamed to `content/terraform` (TASK-030), so the exclusion is `'!../../content/terraform/**'`. Test added in `src/frontend/content.test.ts` ("unreleased courses").
- 2026-10-23 (TASK-031): the "keeps terraform off" unit test was replaced. Terraform now loads in dev and test mode through its own glob, guarded by `import.meta.env.DEV`; the production exclusion was checked on the real build (`dist/` has no lesson text).
- The shell's default Node is v20; vitest crashes on it (`webidl.util.markAsUncloneable is not a function`). Run with Node 24 (`nvm use`, per `.nvmrc`).
