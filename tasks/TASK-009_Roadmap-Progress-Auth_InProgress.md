---
id: TASK-009
type: feature
module: none
decisions: [D-001, D-002, D-003, D-007, D-008, D-009]
created: 2026-10-10
---

# TASK-009: Website login, roadmap progress and lesson read tracking

## Goal
Allow a learner to sign in, track roadmap items and which published lessons they have read, and resume progress across devices using MongoDB Atlas.

## Context
`docs/architecture.md` (Netlify Functions and MongoDB layers), `docs/decisions.md` (D-001 Atlas, D-002 auth, D-003 project layout, D-007 backend layering), `content/aws-saa-c03/roadmap.md`, `content/MCP/roadmap.md`, and `src/frontend/pages/Roadmap/CourseRoadmapPage.tsx`. Depends on the Netlify function/deployment foundation in TASK-004 and TASK-005. Lesson pages: `src/frontend/pages/Lesson/LessonPage.tsx`, catalog in `src/frontend/content.ts`.

Roadmap items and published lessons are **not** one-to-one: roadmap items are AWS lecture lines (305) and MCP acceptance-criteria checkboxes (194), while published lessons are section/overview/visual pages (30 AWS, 16 MCP). A lesson therefore gets its own stable progress ID and is linked to the one roadmap item it starts at, instead of reusing roadmap item records.

## Scope
- In: integrate the selected website identity provider; verify identity in Netlify Functions; persist per-user roadmap item status in Atlas; define stable IDs for trackable roadmap items; provide interactive status controls, per-module/overall completion, and a continue/resume destination; preserve public read-only roadmap browsing.
- In (lesson read tracking): stable lesson progress IDs (`<roadmap>:lesson-NNNN` in `src/shared/lessonProgress.ts`, keyed by the lesson's file under `content/`, independent of title and slug, each linked to a `roadmapItemId`); an explicit "Mark as read" / "Mark as unread" button on lesson pages of roadmap courses; read state saved per user in the same `roadmap_progress` collection and API; read/unread badges and lesson links on the corresponding roadmap item; a separate "lessons read" count on the roadmap.
- Read vs `completed`: a read lesson is stored as `status: 'completed'` under its lesson ID; unread deletes the record. Lessons accept only `completed` (no `in_progress`). Lesson records are counted only as "lessons read": they never complete a roadmap item and never change overall/per-module completion or the continue target, which keep using roadmap items only.
- Out: marking a lesson read automatically on open or scroll; read tracking for lessons outside a roadmap course (e.g. `reactjs`, `context-engineering`); auto-completing roadmap items from read lessons; AI chat and quiz history; MCP OAuth; admin/authoring tools; public social profiles or shared progress; guest-to-account migration; dependency graph visualization; changes to course content unrelated to stable progress IDs.

## Acceptance criteria
- [ ] Given a signed-out visitor, when they open either roadmap, then they can browse it without an account and cannot read or change another user's saved progress.
- [ ] Given a signed-in learner, when they mark a trackable item `in_progress` or `completed`, then the status is saved to Atlas and remains after reload and sign-in on another device.
- [ ] Given a learner with saved statuses, when they view a roadmap, then overall and per-module completion counts are calculated from the current trackable items and a continue action opens their next in-progress item (or the first incomplete item when none is in progress).
- [ ] Given requests to the progress API, when the identity token is absent, invalid, or expired, then protected reads and writes are rejected; the API derives the owner from the verified identity and never trusts a client-supplied user ID.
- [ ] Given two different signed-in accounts, when either account requests or changes progress, then it can access only its own records.
- [ ] Given duplicate updates for one user/roadmap/item, when persisted, then the unique `(userId, roadmapId, itemId)` key prevents duplicate records and an update changes the existing status.
- [ ] Given invalid roadmap IDs, item IDs, or status values, when submitted, then the API rejects the request with a client error and does not write to Atlas.
- [ ] Given a signed-out visitor, when they open a lesson of a roadmap course, then the full lesson is readable and the read control is replaced by a "Sign in to track lessons" link back to that lesson; no progress request is sent.
- [ ] Given a signed-in learner opening a lesson, when the page loads, then it only reads progress (`GET`) and shows "Not marked as read yet" or "Read ✓"; opening a lesson never marks it read.
- [ ] Given a signed-in learner, when they press "Mark as read", then `PUT /api/progress/:roadmapId` saves `{ itemId: <lesson ID>, status: 'completed' }` for the cookie's user; the state remains after reload and on another device. When they press "Mark as unread", then `DELETE` removes only that lesson's record and leaves other lessons and roadmap items unchanged.
- [ ] Given a lesson update request with an unknown lesson ID, a lesson ID from another roadmap, a lesson slug instead of an ID, `in_progress` for a lesson, or an extra `userId` field, when submitted, then the API answers 400 and does not write to Atlas.
- [ ] Given saved read lessons, when the learner views the roadmap, then the corresponding roadmap item shows the lesson link with "Read ✓" or "Unread", the summary shows "N of M lessons read", and item completion counts and the continue target are unchanged by lesson reads.
- [ ] Given the lesson catalog and `lessonProgressManifest`, when tests run, then every routable lesson page of a roadmap course has exactly one lesson ID, every lesson ID points at an existing lesson page and roadmap item, and lesson IDs never collide with roadmap item IDs.
- [ ] Given a Netlify deploy preview and production deploy, when auth redirects and protected API calls run, then each environment uses its configured callback URLs and server-only secrets without exposing credentials in the frontend bundle.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Call a protected progress endpoint without a token | 401/unauthorized; no database write | unit |
| 2 | Call with an invalid or expired identity token | Rejected; no user data returned or written | unit |
| 3 | Account A creates or updates an item, then reloads progress | Saved status is returned for A | integration |
| 4 | Account B requests A's progress or submits A's user ID | Only B's own progress is returned/changed; A's data is inaccessible | integration |
| 5 | Submit malformed item ID or unsupported status | 400 validation response; database unchanged | unit |
| 6 | Open AWS and MCP roadmaps signed out | Both remain browsable; progress controls prompt for sign-in or are disabled accessibly | component |
| 7 | Sign in and update an item; reload and use continue | Status, percentages, and resume destination reflect persisted progress | component / manual |
| 8 | Inspect a production build for Atlas URI and auth secrets | No server secrets appear in frontend assets | build/security |
| 9 | Exercise configured auth callback and API from Netlify preview and production | Both environments authenticate and call protected API using their own settings | manual |
| 10 | Open a roadmap lesson signed out | Lesson content renders; "Sign in to track lessons" links to `/login?redirect=<lesson path>`; no `/api/progress` request | component (`LessonPage.test.tsx`) |
| 11 | Open a lesson signed in | Only a `GET`; button "Mark as read"; saved `completed` shows "Mark as unread" after reload | component (`LessonPage.test.tsx`) |
| 12 | Mark read, then unread | `PUT {itemId: lessonId, status: 'completed'}` then `DELETE {itemId: lessonId}`; no user ID in either body | component (`LessonPage.test.tsx`) |
| 13 | Progress API: lesson `completed` / `DELETE` for user from cookie | `setStatus(cookieUser, roadmap, lessonId, 'completed')` / `clearStatus` for that lesson only | unit (`progress.test.ts`) |
| 14 | Progress API: unknown lesson, other roadmap's lesson, slug, `in_progress` lesson, `userId` in body, unknown roadmap | 400; no write | unit (`progress.test.ts`) |
| 15 | Progress API without / with tampered cookie | 401; no read or write | unit (`progress.test.ts`) |
| 16 | Roadmap with a read lesson and one in-progress item | Badge "Read ✓" on the lesson's roadmap item; "0 of 305 complete"; "1 of N lessons read"; continue → the in-progress item | component (`RoadmapProgressView.test.tsx`) |
| 17 | Roadmap signed out | Lesson links shown without read badges; all 305 status selects render, disabled; no progress request | component (`RoadmapProgressView.test.tsx`) |
| 18 | Lesson manifest vs catalog | No routable lesson without an ID; no ID without a lesson page or valid roadmap item; IDs unique | unit (`content.test.ts`, `lessonProgress.test.ts`) |

## Notes
- D-001 is accepted: progress uses MongoDB Atlas.
- D-002 is accepted. Identity was Clerk (D-008); TASK-010 replaces it with the site's own auth (D-009): email + password and Google, session in an httpOnly cookie. This is separate from MCP Module 7 OAuth.
- Implemented code includes the progress endpoint and the minimal Netlify function routing/config needed by TASK-009. TASK-004's health endpoint/footer and TASK-005's connected site/deploy checks remain separate work; local and production callback behavior cannot be marked complete until Google OAuth/Atlas/Netlify settings are configured.
- No connection string, username, password, or token belongs in this task, Git, chat, or frontend code. The ignored `atlas-credentials.env` file was not read or reused.
- The Atlas credentials were reported exposed in a conversation attachment. Rotate the Atlas database user's password before configuring local development or Netlify; put the replacement only in `.env` and server-side Netlify environment settings. Confirm Atlas network access is compatible with the chosen Netlify plan; avoid a broad public allow-list for production where fixed egress is available.
- Lesson IDs are stored in `src/shared/lessonProgress.ts`. When a lesson file moves, update its `path` and keep its ID; a new lesson gets the next unused number. `content.test.ts` fails if a lesson page has no ID.
- Two MCP Module 7 overview files share the slug `module-7-module-7-remote-auth-deploy`; only the first is reachable, so the shadowed copy (`MCP/Module 7/Module-7/Module 7/…`) has no lesson ID.
- Fixed while adding lesson badges: roadmap status selects never rendered (remark-gfm's task checkbox has no source position, so every item showed as "needs a progress ID"); items are now matched on their `<li>`. The Markdown overrides are now stable components fed by context, so changing a status no longer remounts the roadmap and drops keyboard focus.
- Roadmap IDs are stored in `src/shared/roadmapProgress.ts`; IDs are independent of checklist wording. When adding/removing a checklist line, update the manifest's source-line lookup while preserving IDs for existing items.
- Remaining completion work: configure the Google OAuth client and `JWT_SECRET` (see `docs/auth-setup.md`), rotate and configure Atlas credentials, run the app with Netlify Functions, and exercise deploy-preview/production callbacks once TASK-005 is connected.
