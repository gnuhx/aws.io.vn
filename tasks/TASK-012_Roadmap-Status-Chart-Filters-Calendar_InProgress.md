---
id: TASK-012
type: feature
module: none
decisions: [D-001, D-007]
created: 2026-10-11
---

# TASK-012: Roadmap status colors, progress chart, filters and learning calendar

## Goal
Make roadmap progress readable at a glance: status dropdowns are colored by status, the roadmap header shows a donut chart of item statuses with filters for the list, and a calendar shows on which days the learner actually studied (and how long they have been idle).

## Context
Builds on TASK-009 (roadmap progress + lesson read tracking). Files: `src/frontend/pages/Roadmap/RoadmapProgressView.tsx`, `src/frontend/progress/api.ts`, `src/backend/repositories/progress.ts`, `src/backend/services/progress.ts`, `src/backend/functions/progress.ts`. D-001 (Atlas), D-007 (backend layering: function → service → repository).

`roadmap_progress` keeps only the latest status per item (and unread/not-started deletes the record), so it cannot answer "what did I do on which day". The calendar needs an append-only activity log.

## Scope
- In: status select colored by its value (not started = gray, in progress = amber, completed = green), with the text label still visible so color is never the only cue.
- In: donut chart in the progress summary (completed / in progress / not started, % complete in the center, legend with counts, hover tooltip per segment) plus a mini bar per module row.
- In: filters above the roadmap list: status (All / Not started / In progress / Completed), lessons (All items / Has lesson / Unread lesson), and a "N of M items shown" count. Filters hide non-matching roadmap items; non-item content (headings, tables) stays.
- In: `roadmap_progress_activity` collection: one event `{ userId, roadmapId, itemId, status, at }` per successful status change (including clear → `not_started`). Recording failures are logged and never fail the progress update.
- In: `GET /api/progress/:roadmapId/activity` (auth required) returns the cookie user's events from the last 365 days. Records saved before the log existed are backfilled from their `updatedAt` so existing learners don't see an empty calendar.
- In: learning calendar (GitHub-style heatmap, last 365 days, bucketed by the browser's local date) with active days, current streak, longest streak and days since last activity ("how lazy" message when idle).
- Out: cross-roadmap combined calendar; per-day drill-down list; persisting filter choice; module filter (headings would remain with empty lists); dark mode (site is light-only today); deleting/expiring old activity events.

## Acceptance criteria
- [ ] Given a status select, when its value is not started / in progress / completed, then it shows gray / amber / green styling and keeps its text label.
- [ ] Given a signed-in learner, when the roadmap loads, then the header shows a donut whose segments equal the completed / in-progress / not-started counts, and the center shows % complete.
- [ ] Given the status filter set to "In progress", when applied, then only roadmap items with status `in_progress` remain visible and the count reads "N of M items shown".
- [ ] Given the lessons filter "Unread lesson", when applied, then only items with at least one unread linked lesson remain visible.
- [ ] Given a signed-in learner, when they change any status (item or lesson), then an activity event is stored for the cookie's user with the server time; a failure to store it still returns the normal success response.
- [ ] Given requests to `/api/progress/:roadmapId/activity`, when there is no or an invalid session, then 401; when the roadmap ID is unknown, then 400; otherwise only the cookie user's events are returned.
- [ ] Given activity events, when the calendar renders, then each day's cell intensity reflects that local day's event count, a tooltip names the date and count, and streak / idle stats are correct.
- [ ] Given a signed-out visitor, when they open the roadmap, then no chart, calendar or activity request appears; the lesson filter still works.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Render roadmap with one in-progress item | That select has the in-progress class; others not-started | component |
| 2 | Signed in with 1 completed, 1 in progress of 305 | Donut labelled "1 completed, 1 in progress, 303 not started"; center 0% | component |
| 3 | Status filter "In progress" | 1 visible roadmap item; "1 of 305 items shown" | component |
| 4 | Lessons filter "Has lesson" | Only items with lesson links visible | component |
| 5 | Activity endpoint without cookie / unknown roadmap / valid cookie | 401 / 400 / `listActivity(cookieUser, roadmap, since)` | unit |
| 6 | PUT/DELETE progress | status written, then activity recorded; activity error still 200 | unit (service) |
| 7 | `summarizeActivity` with events on consecutive days, gap, today/yesterday | Correct day counts, current streak, longest streak, idle days | unit |
| 8 | Signed out | No donut, no calendar, no activity fetch | component |

## Notes
- Event timestamps are stored in UTC; the client buckets them by local date so a 6am study session in UTC+7 lands on the right day.
- Backfill uses a record's `updatedAt` only for items with no logged event, so items changed after this ships aren't double-counted.
- Colors: status palette good `#0ca30c`, warning `#fab219`, neutral gray; calendar uses a single blue ramp (sequential magnitude).
