---
id: TASK-033
type: chore
module: none
decisions: []
created: 2026-10-22
---

# TASK-033: Release the Terraform course

## Goal
The Terraform course is live on the website and works end to end.

## Context
Final step of the Terraform plan. Depends on TASK-029 (rights/language decided), TASK-030, TASK-031 and TASK-032 being done.

## Scope
- In: Remove the two `import.meta.env.DEV ? … : {}` guards around the terraform globs in `src/frontend/content.ts` (added in TASK-031; keep the `!../../content/terraform/**` exclusion in the main glob, which stops the generic parser from double-loading it); full test suite and build; manual QA on a deploy preview; merge `development` → `main`; post-deploy smoke check.
- Out: New content.

## Acceptance criteria
- [ ] `npm test`, `npm run lint` and `npm run build` pass; bundle size increase is checked (images are the main cost).
- [ ] On the deploy preview: the home page shows the Terraform topic; one lesson per chapter (18) is opened and text, code highlighting and images render; mobile width has no horizontal scroll on code-heavy pages.
- [ ] Signed in: marking read, roadmap and progress ring work for Terraform.
- [ ] Existing courses (SAA-C03, MCP, reactjs) still load and keep their progress.
- [ ] After production deploy, the smoke test (TASK-006) passes.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Visit `/terraform` | 18 chapters, correct order, roadmap link | manual |
| 2 | Visit one lesson per chapter | Renders fully, no 404 assets | manual |
| 3 | Visit old course URLs | Unchanged | manual |

## Notes
TASK-029 decided: publish in English as-is (D-011).
