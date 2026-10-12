---
id: TASK-013
type: feature
module: none
decisions: []
created: 2026-10-12
---

# TASK-013: Loading indicators and toast notices for every async API call

## Goal
Every action that calls the API (sign in, register, Google sign-in, sign out, roadmap status change, lesson read toggle, progress loading) shows that it is working and tells the learner when it succeeded or failed, so clicks never feel ignored.

## Context
Audit of `await` / `.then` call sites in `src/frontend` (2026-10-12):

| Call site | Before | Gap |
|---|---|---|
| `auth/AuthProvider.tsx` `me()` on load | header renders nothing | no indicator |
| `pages/Auth/AuthPage.tsx` login / register / Google | button text "Signing in…" | no spinner, no success notice |
| `layouts/SiteLayout.tsx`, `pages/Account/AccountPage.tsx` logout | nothing | no busy state, no notice, server errors swallowed |
| `pages/Roadmap/RoadmapProgressView.tsx` list load | "Loading saved progress…" under a 305-item list | not visible on screen |
| `pages/Roadmap/RoadmapProgressView.tsx` status change | every select silently disabled | no per-item spinner, no saved notice |
| `pages/Lesson/LessonReadControl.tsx` read toggle | "Saving…" text | no spinner, no notice |
| `pages/Lesson/LessonPage.tsx` markdown fetch | summary body shown | no indicator |

Related: TASK-009, TASK-010, TASK-012.

## Scope
- In: a small dependency-free toast system (`components/Toast`) — success / error / info, auto-dismiss (errors stay longer), close button, announced through an `aria-live` region. `useToast()` is a no-op outside the provider so isolated component tests keep working.
- In: a `Spinner` component (respects `prefers-reduced-motion` through the global rule).
- In: spinners on the auth submit button, sign-out buttons, roadmap item being saved, lesson read button, header while the session is checked, roadmap summary while progress loads, lesson body while markdown loads.
- In: toasts for signed in / account created / signed out / progress saved / lesson marked read or unread, and for every failure (inline errors stay where they already exist).
- In: sign-out goes through a `useLogout()` hook with a busy flag; a server failure still signs the browser out but says so.
- Out: optimistic updates; retry queues; a toast library dependency; dark mode.

## Acceptance criteria
- [x] Given the auth form, when a sign-in / register / Google request is in flight, then the submit button is disabled and shows a spinner; on success a "Signed in" / "Account created" toast appears.
- [x] Given a signed-in user, when they click Sign out, then the button shows a spinner and is disabled until done, and a "Signed out" toast appears (or an error toast if the server call failed).
- [x] Given a roadmap status change, when the save is in flight, then that item shows a spinner; on success a "Progress saved" toast appears; on failure an error toast plus the existing inline error.
- [x] Given a lesson read toggle, when it saves, then the button shows a spinner and a toast confirms read / unread or reports the failure.
- [x] Given the roadmap is loading saved progress, then the summary card at the top shows a spinner with "Loading saved progress…".
- [x] Toasts are announced to screen readers and can be dismissed.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `toast.success('x')` inside provider | "x" visible in the live region, gone after timeout / close | component |
| 2 | `useToast()` without provider | no throw | component |
| 3 | Successful login | "Signed in" toast shown, redirect still happens | component |
| 4 | Roadmap status change succeeds / fails | "Progress saved" / error toast | component |
| 5 | Sign out | busy state then "Signed out" toast | manual |

## Notes
- Toasts live above `AuthProvider` in `main.tsx` so auth flows and every route can use them.
- Tests: `components/Toast/ToastProvider.test.tsx` (cases 1, 2) and two roadmap save tests in `RoadmapProgressView.test.tsx` (case 4). Case 3 is not automated: `AuthPage.test.tsx` already fails on `development` before this task (the local `.env` sets `VITE_GOOGLE_CLIENT_ID`, so `GoogleLogin` renders without a `GoogleOAuthProvider`), as does `HomePage.test.tsx` (no router context).
- Lesson page loaders use `aria-busy` on the article, not `role="status"`, so the read control stays the page's only status region.
