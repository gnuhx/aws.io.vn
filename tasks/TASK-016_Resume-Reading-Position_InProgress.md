---
id: TASK-016
type: feature
module: none
decisions: [D-007, D-009]
created: 2026-10-12
---

# TASK-016: Resume reading where I left off (opt-in)

## Goal
A learner who turns on "Resume where I left off" in Settings reopens a lesson and is smooth-scrolled to the section they were last reading. With the setting off (the default), lessons open at the top and nothing is tracked or requested.

## Context (Step 1 findings, 2026-10-12)
- **App:** Vite + React 19 SPA, `createBrowserRouter` (react-router 8) in `src/frontend/router.tsx`. No SSR. Netlify Functions under `src/backend/functions` (function → service → repository, D-007).
- **Reading pages:** `/:topic/:slug` → `src/frontend/pages/Lesson/LessonPage.tsx`. Markdown lessons: `LessonContent` fetches `lesson.markdownUrl` and renders `components/Markdown/MarkdownView.tsx` (react-markdown + remark-gfm), keyed by slug, so it remounts per lesson. Interactive lessons are a sandboxed cross-origin-less `<iframe>`; their headings are not reachable. `/:topic` (`pages/Topic/TopicPage.tsx`) is a short lesson index, not an article.
- **Sticky header on lesson pages:** `.topbar` in `LessonPage.module.css`, `position: sticky; min-height: 3.75rem`.
- **Auth (D-009):** session JWT in httpOnly cookie; `withAuth` in `src/backend/middleware/http.ts` gives handlers `{ userId }` from the cookie; non-GET requests must be `application/json` and same-origin (CSRF). Client: `useAuth()` (`auth/authContext.ts`), user from `GET /api/auth/me` (`PublicUser` in `shared/schemas/auth.ts`).
- **User settings (TASK-015):** fields on the `users` document (`repositories/users.ts`, no migrations: missing field = default, indexes created lazily in the repository). API `/api/profile` (GET/PUT, strict zod schema in `shared/schemas/profile.ts`) and `/api/profile/password`. UI `pages/Settings/SettingsPage.tsx` with Profile / Password / Session cards.
- **Heading ids:** none. react-markdown renders bare `<h2>`/`<h3>`.

## Design (Step 2)

### Heading ids
A tiny rehype plugin `rehypeHeadingIds` (in `components/Markdown/`, uses the already-installed `unist-util-visit`) gives every h1–h4 an `id` = slugified text (lowercase, accents stripped, non-alphanumerics → `-`), de-duplicated with `-2`, `-3` in document order (GitHub style). Applied in `MarkdownView` so lesson and roadmap pages both get anchors. Ids are stable while heading text is unchanged; a renamed heading simply means the saved section is not found → page opens normally.

### Data
- `users.resumeReading?: boolean` (missing = `false`). Exposed as `PublicUser.preferences.resumeReading`, so the lesson page knows the setting from `/api/auth/me` with **no extra request** when OFF.
- New collection `reading_progress`: `{ userId, topicId, lessonSlug, sectionId, updatedAt }`, unique index `(userId, topicId)` → **one row per user + course** (upsert; approved 2026-10-12). It holds the most recently read lesson of that course and the section inside it.

### API (all `withAuth`; owner always the cookie user, request bodies are `.strict()` so a `userId` field is rejected)
| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/api/reading/:topic` | — | `{ position: { lessonSlug, sectionId, updatedAt } \| null }` |
| PUT, POST | `/api/reading/:topic` | `{ lessonSlug, sectionId }` | upsert; `204`-style `{ saved: true }`. **If the user's setting is OFF the write is ignored** (`{ saved: false }`), so a late beacon from another tab can't recreate rows after opt-out. POST exists because `sendBeacon` can only POST. |
| PUT | `/api/profile/preferences` | `{ resumeReading }` | saves the setting; switching to `false` **deletes all the user's `reading_progress` rows** in the same service call (this is the delete-all). Returns the updated user. |

Validation: `topic` `^[A-Za-z0-9_-]{1,100}$`, `lessonSlug` `^[A-Za-z0-9._-]{1,150}$`, `sectionId` `^[a-z0-9][a-z0-9-]{0,119}$`.

### Client
`reading/useResumeReading({ topic, lessonSlug, containerRef, contentReady })` used by `LessonContent`:
- `enabled = signed-in && user.preferences.resumeReading`. When false the hook returns before creating observers, timers or requests.
- **Restore** (once per page): if `location.hash` → do nothing (hash wins, no GET). Else GET the course's saved position; if it is for a different lesson → do nothing. Otherwise → wait until content is ready (markdown fetched) **and** stable: all `<img>` in the article loaded/errored and a `ResizeObserver` reports no size change for 300 ms (3 s cap) → `getElementById(sectionId)`; missing → do nothing. `scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })`.
- **Track** (after restore settles, so the restore scroll itself isn't saved as a reading position): `IntersectionObserver` on article h1–h4 with `rootMargin: '0px 0px -70% 0px'` (only the top 30 % of the viewport counts as "reading here"). On each callback, current = last heading whose top is above that line. Save debounced 1.5 s via `fetch PUT`, skipped if unchanged.
- **Flush:** on `visibilitychange → hidden` and `pagehide`, send the pending section with `navigator.sendBeacon` (JSON Blob, same-origin); fall back to `fetch(..., { keepalive: true })` if the beacon is refused. On SPA route change / unmount: disconnect observers, clear timers, flush pending with keepalive fetch.
- CSS: `scroll-margin-top: 4.75rem` on article headings (sticky topbar is 3.75 rem).

### Course page
When the setting is ON, `TopicPage` fetches the course's position and shows "Continue reading: <lesson title>" linking to that lesson (no hash, so the lesson restores the section). OFF → no request, no link.

### Settings UI
New "Reading" card in `SettingsPage`: switch "Resume where I left off" + explanation. Saves immediately (spinner + toast). Turning it OFF warns inline that saved positions will be deleted, then toast "Reading positions deleted". Auth context is updated so open pages react immediately.

### Files
- Create: `shared/schemas/reading.ts`, `backend/repositories/readingProgress.ts`, `backend/services/reading.ts`, `backend/functions/reading.ts`, `backend/functions/profile-preferences.ts`, `frontend/reading/api.ts`, `frontend/reading/useResumeReading.ts`, `frontend/components/Markdown/rehypeHeadingIds.ts`, tests for each layer.
- Modify: `shared/schemas/auth.ts` (`preferences`), `shared/schemas/profile.ts` (`preferencesSchema`), `backend/repositories/users.ts` (`resumeReading`, `setResumeReading`), `backend/services/auth/authService.ts` (`toPublicUser`, `setPreferences`), `frontend/components/Markdown/MarkdownView.tsx`, `frontend/pages/Lesson/LessonPage.tsx` + css, `frontend/pages/Settings/SettingsPage.tsx` + css, `frontend/profile/api.ts`, test fixtures using `PublicUser`, `docs/auth-setup.md`.

## Scope
- In: markdown lesson pages (`/:topic/:slug`), the setting, the API, deletion on opt-out.
- Out: interactive (iframe) lessons; roadmap pages (they get heading ids but no tracking); cross-device "continue" list on home; scrolling to `#hash` on first load (existing behavior unchanged).

## Acceptance criteria
- [x] Setting OFF (default): opening a lesson creates no `IntersectionObserver`, sends no `/api/reading` request, and stays at the top.
- [x] Setting ON: after scrolling to a section and waiting > 1.5 s (or hiding the tab), reopening the lesson smooth-scrolls to that section's heading, not hidden under the sticky bar.
- [x] URL with `#hash`: saved progress is not fetched or applied.
- [x] Saved section no longer exists: page opens at the top, no error shown.
- [x] `prefers-reduced-motion: reduce`: jumps instantly.
- [x] Switching ON → OFF: tracking stops on open pages and every `reading_progress` row of that user is deleted; later writes are ignored.
- [x] `/api/reading/*` without a session → 401; a body with `userId` → 400; reads/writes only touch the cookie user's rows.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `rehypeHeadingIds` on duplicate / accented headings | `intro`, `intro-2`, `cau-hinh-vpc` | unit |
| 2 | reading function: no cookie / bad section / `userId` in body / GET / PUT / POST | 401 / 400 / 400 / service called with cookie user | unit |
| 3 | service upsert while setting OFF | ignored | unit |
| 4 | preferences false | `deleteAllForUser(cookieUser)` called | unit |
| 5 | hook OFF | no observer, no fetch | component |
| 6 | hook ON with `#hash` | no GET, no scroll | component |
| 7 | hook ON, saved section exists / missing | `scrollIntoView` / nothing | component |
| 8 | hook ON, heading crosses line, 1.5 s | one PUT with that section | component |
| 9 | Settings toggle OFF | PUT preferences false, toast | component |

## Notes
- Waiting for "no layout shift" is approximated with ResizeObserver quiet time; fonts/late iframes inside markdown could still move content slightly after the scroll.
- `sendBeacon` with an `application/json` Blob is same-origin here, so it passes the JSON/Origin CSRF checks without a preflight.
- Implemented 2026-10-12 with the per-course row (user's choice). Debounced background saves fail silently (no toast): a missed save only costs one position, and a toast while scrolling would be noise.
- Race left open: a save that passed the "setting on" check just before opt-out could land after the delete. The window is one request; the next save is refused.
- Tests: `functions/__tests__/reading.test.ts`, `services/reading.test.ts`, `reading/useResumeReading.test.tsx`, `reading/ContinueReading.test.tsx`, `components/Markdown/rehypeHeadingIds.test.tsx`, Settings toggle in `SettingsPage.test.tsx`.
