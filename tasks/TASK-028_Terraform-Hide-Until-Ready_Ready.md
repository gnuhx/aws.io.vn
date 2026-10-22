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
- [ ] Given `content/Terraform/` exists, when the site builds, then `getTopics()` has no Terraform topic and the home page is unchanged.
- [ ] `npm run build` and the test suite pass.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `getLessonCatalog()` | No key `Terraform` / `terraform` | unit |
| 2 | Build | No Terraform markdown in the bundle | manual |

## Notes
Removed again in TASK-033 when the course is released.
