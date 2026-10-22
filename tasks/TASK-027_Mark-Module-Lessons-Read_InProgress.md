---
id: TASK-027
type: feature
module: none
decisions: []
created: 2026-10-16
---

# TASK-027: Mark module lessons read

## Goal
Learners can mark all trackable lessons in a module as read from the module header on the topic overview, without opening each lesson.

## Context
Module headers and lesson lists are rendered in `src/frontend/pages/Topic/TopicPage.tsx`. Lesson read state is stored separately from roadmap checklist state (`src/shared/lessonProgress.ts`); only published lessons present in the progress manifest are trackable. Current progress writes accept one item per request (`src/backend/functions/progress.ts`).

## Scope
- In: Add a module-header action and read count for signed-in learners; mark all remaining trackable lessons in that module as read; show loading/success/error feedback; support the existing sign-in flow for signed-out visitors; add a validated bulk progress operation if needed to avoid one request per lesson.
- Out: Marking roadmap checklist items complete; adding tracking IDs for currently untracked materials; automatically marking lessons read when opened; bulk mark-unread behavior.

## Acceptance criteria
- [x] Given a signed-in learner and a module with unread trackable lessons, when they activate the module action, then all trackable lessons in that module are saved as read and the displayed count updates.
- [x] Given some lessons in that module are already read, when the learner marks the module read, then those lessons remain read and the remaining lessons are marked read.
- [x] Given a module contains materials without lesson-progress manifest entries, when module progress is calculated or saved, then those materials are excluded and no unrecognized IDs are accepted by the API.
- [x] Given module lessons are marked read, then roadmap checklist-item statuses and roadmap completion counts remain unchanged.
- [x] Given the learner is signed out, then the page remains browsable, the module action directs them to sign in, and no progress is fetched or changed.
- [x] Given a bulk save fails, then the learner sees an error and the UI does not claim every lesson was marked read; retrying is safe.
- [x] Given the learner reloads the topic page, then the saved read count is restored from progress state.
- [x] The action is keyboard accessible, has an accessible name and saving/disabled state, and remains usable on narrow screens.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Render module overview signed out | Module actions direct to sign in; no progress request; lessons remain navigable | component |
| 2 | Load signed-in module with mixed read/unread statuses and activate action | Only unread tracked lessons are saved; count updates; already-read lessons are retained | component |
| 3 | Module contains untracked material | It is excluded from the total and bulk request | unit / component |
| 4 | Bulk API receives valid lesson IDs for one roadmap | All accepted lesson statuses are saved as completed | function / integration |
| 5 | Bulk API receives an unknown ID, roadmap item ID, or lesson ID from another roadmap | Request is rejected; no unrelated progress is changed | function |
| 6 | Bulk save fails, then retry | Error feedback is shown; retry can complete without duplicate or inconsistent lesson state | component / integration |
| 7 | Reload after successful bulk save | Module read count reflects persisted statuses | component |

## Notes
- Default scope is all trackable lessons in the displayed module, not every material. Adding tracking IDs for currently untracked content is a separate content/progress-manifest decision.
- Keep lesson `completed` records distinct from roadmap checklist items; do not change roadmap completion or continue-target behavior.
- This task records the proposed feature for review. Creating it does not begin implementation; implementation remains subject to the user's decision.
