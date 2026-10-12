---
id: TASK-014
type: feature
module: none
decisions: [D-007]
created: 2026-10-12
---

# TASK-014: Progress ring on each topic card on the home page

## Goal
A signed-in learner sees at a glance, on the home screen, how far they are in every course: a ring with % complete plus counts of completed / in-progress items and lessons read.

## Context
Builds on TASK-009 / TASK-012. Roadmaps: `roadmapProgressManifest` (`aws-saa-c03`, `MCP`). Data comes from the existing `GET /api/progress/:roadmapId` (one request per roadmap topic); counting mirrors `RoadmapProgressView` (only roadmap items count toward %, lessons counted separately).

## Scope
- In: `ProgressRing` component (compact: completed + in-progress arcs, % in the center, `role="img"` label with counts).
- In: home cards for roadmap topics show the ring, "N of M items complete", "K in progress · R of L lessons read" when signed in; a spinner while loading; "Couldn't load progress" on failure (card still links to the course).
- In: signed-out visitors see "M roadmap items · sign in to track progress"; no progress request is sent.
- In: topics without a roadmap show nothing extra.
- Out: a combined summary endpoint (2 roadmaps today, so 2 small requests are fine); caching between pages.

## Acceptance criteria
- [ ] Given a signed-in learner with 1 completed and 1 in-progress item in AWS SAA-C03, when the home page loads, then that card shows a ring labelled "1 completed, 1 in progress, 303 not started" and "1 of 305 items complete".
- [ ] Given a signed-out visitor, then cards show the item count and a sign-in hint, and `fetch` is never called.
- [ ] Given a progress request fails, then that card shows an error line and still links to the course.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Signed in, statuses `{item-0001: completed, item-0002: in_progress}` | Ring label + "1 of 305 items complete" | component |
| 2 | Signed out | Sign-in hint, no fetch | component |
| 3 | Progress request 500 | "Couldn't load progress" on that card | component |

## Notes
- Fixes the existing `HomePage.test.tsx` failure (it rendered `<Link>` without a router).
