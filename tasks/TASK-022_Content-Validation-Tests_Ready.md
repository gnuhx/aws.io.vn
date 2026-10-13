---
id: TASK-022
type: chore
module: none
decisions: [D-006]
created: 2026-10-13
---

# TASK-022: Content validation tests for lessons

## Goal
A broken lesson (bad structure, dead internal link, duplicate slug) fails CI instead of being found by a learner.

## Context
D-006 lists "content validation" as part of `npm run verify`, but today only `src/frontend/content.test.ts` checks lesson tracking IDs. `content/` has ~675 files; structure rules are in `docs/LESSON_TEMPLATE.md`.

## Scope
- In: a test file (Node project) that loads every lesson the site serves and checks: required parts of LESSON_TEMPLATE (title / first heading), unique slugs per topic, relative links and image paths resolve to existing files, internal `/topic/slug` links point to an existing lesson, no empty lessons
- Out: spelling/grammar; external URL checks (slow, flaky; could be a nightly job later); sample code inside `content/` (not app code)

## Acceptance criteria
- [ ] Given the current `content/`, when tests run, then they pass (or the found problems are listed and fixed/allow-listed in this task)
- [ ] Given a lesson with a link to a missing lesson, when tests run, then the test fails naming the file and the link
- [ ] Given two lessons with the same slug in one topic, when tests run, then it fails naming both

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | current content | pass (after fixes) | unit |
| 2 | fixture lesson with dead internal link | fails, names file + link | unit |
| 3 | fixture duplicate slug | fails, names both files | unit |
| 4 | fixture lesson missing title | fails | unit |

## Notes
- Write the checks as pure functions tested with small fixtures, then one test that runs them over the real `content/` (functional core / imperative shell, like `buildChecks.ts`).
- `content/` is read-only for Claude Code; content fixes found here go to you.
