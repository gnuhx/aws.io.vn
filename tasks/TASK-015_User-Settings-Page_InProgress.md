---
id: TASK-015
type: feature
module: none
decisions: [D-007, D-009]
created: 2026-10-12
---

# TASK-015: User settings page (profile, avatar, password)

## Goal
Learners get a settings page like other learning sites: they can see their avatar (Google photo, or initials), edit display name, hobbies, tech stack and a short introduction, and change (or, for Google-only accounts, set) their password.

## Context
Auth is ours (D-009): `users` collection in Atlas, `src/backend/repositories/users.ts`, `services/auth/authService.ts`. Layering D-007: function → service → repository; every function is `withAuth` or `publicEndpoint`. Current `/account` page only shows email + sign out.

## Scope
- In: `users` document gains optional `avatarUrl`, `hobbies[]`, `techStack[]`, `bio`. Google sign-in stores the verified token's `picture` (https only) and refreshes it on each Google login.
- In: `PublicUser` gains `avatarUrl` and `hasPassword` (header shows the avatar; settings knows whether to ask for the current password).
- In: `GET /api/profile` → profile (public user + hobbies, techStack, bio). `PUT /api/profile` validates with a shared zod schema: name ≤ 60 chars (empty → none), up to 10 hobbies and 20 tech items (each 1–30 chars, de-duplicated case-insensitively), bio ≤ 500 chars.
- In: `POST /api/profile/password` `{ currentPassword?, newPassword }`. Accounts with a password must give the right current password (wrong → 400 with a field error, same bcrypt timing). Google-only accounts may set a first password without one. New password follows the register rules and must differ from the current one.
- In: `/settings` page (protected): Profile card (avatar, name, email read-only, hobbies + tech stack as tag inputs, bio with counter), Password card, Sign out. Loading spinner, toast on save / failure, field errors inline. `/account` redirects to `/settings`; header shows avatar + name linking to settings.
- Out: changing email (needs verification flow), uploading a custom avatar (needs file storage), unique @username handles, deleting the account, invalidating other sessions after a password change (sessions are stateless JWTs — follow-up), rate-limiting password attempts (already a D-009 follow-up).

## Acceptance criteria
- [ ] Given a Google sign-in whose token has a `picture`, then the user's `avatarUrl` is that URL and the header/settings show it; without one, initials are shown.
- [ ] Given a signed-in learner, when they save name / hobbies / tech stack / bio, then `PUT /api/profile` stores the normalized values, the header name updates, and a "Profile saved" toast appears.
- [ ] Given invalid profile input (e.g. 501-char bio), then the API answers 400 with field errors and the form shows them.
- [ ] Given a password account, when the current password is wrong, then 400 `{ fields: { currentPassword } }` and nothing changes; when right, the hash is replaced and a toast confirms.
- [ ] Given a Google-only account, then the form shows "Set a password" without a current-password field and the API accepts it.
- [ ] Given no session, then every `/api/profile*` request is 401.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | `profileUpdateSchema` with duplicates / blanks / too long | normalized / rejected | unit |
| 2 | `updateProfile`, `changePassword` (right, wrong, Google-only, same as old) | stored / `wrong_password` / set / `same_password` | unit (service) |
| 3 | Google login with picture for new and existing user | `avatarUrl` stored / refreshed | unit (service) |
| 4 | `/api/profile` GET/PUT and `/api/profile/password` with/without cookie | 401 without; 200/400 with | unit (function) |
| 5 | Settings page save | PUT body, toast, field error rendering | component |

## Notes
- Avatar `<img>` uses `referrerPolicy="no-referrer"` (Google photo URLs can refuse requests with a referrer).
