---
id: TASK-032
type: feature
module: none
decisions: []
created: 2026-10-22
---

# TASK-032: Terraform roadmap and lesson read tracking

## Goal
Signed-in learners can see the Terraform roadmap, mark lessons and modules read, and see Terraform progress on the home page, like the reactjs and MCP courses.

## Context
Per-course wiring today: `content/<topic>/roadmap.md`; the roadmap glob and `getCourseRoadmap` in `src/frontend/content.ts`; `roadmapProgressManifest` in `src/shared/roadmapProgress.ts` (defines `RoadmapId`); `lessonProgressManifest` in `src/shared/lessonProgress.ts` (stable lesson IDs, never renumbered); `src/shared/schemas/roadmap-progress.ts`; roadmap link in `src/frontend/pages/Topic/TopicPage.tsx`. See `.claude/lessons/content-lesson-page-missing-tracking-id.md` for the failure this avoids. Depends on TASK-031 (final lesson paths).

## Scope
- In:
  - Write `content/terraform/roadmap.md`: 18 modules (one per chapter) with checklist items per section, plus a certification-prep track (Ch18).
  - Exclude it from the lesson glob; add it to `getCourseRoadmap`.
  - Add `terraform` items to `roadmapProgressManifest` and `terraform:lesson-0001…` entries for every lesson to `lessonProgressManifest`, each mapped to a roadmap item.
  - Accept the new roadmap ID in the progress schema and backend validation.
  - Roadmap link on the Terraform topic page.
- Out: Quizzes / practice exams for the Terraform Associate exam (possible follow-up task).

## Acceptance criteria
- [ ] Given `/terraform/roadmap`, then all 18 modules render with checklist items.
- [ ] Given a signed-in learner, when they mark a Terraform lesson or a whole chapter read, then it persists across reloads and shows on the roadmap and home progress ring.
- [ ] Given every Terraform lesson page, then it has a tracking ID (test: no published lesson without a manifest entry).
- [ ] Given progress API requests with Terraform IDs, then valid IDs are accepted and IDs from other roadmaps are rejected.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Manifest vs catalog | Every Terraform lesson path has exactly one lesson ID; no orphan IDs | unit |
| 2 | Progress function with `terraform:lesson-0001` | Saved as completed | function |
| 3 | Progress function with `terraform:lesson-9999` | Rejected | function |
| 4 | Mark chapter read, reload | Count restored | component / manual |

## Notes
