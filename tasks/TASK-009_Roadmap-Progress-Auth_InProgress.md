---
id: TASK-009
type: feature
module: none
decisions: [D-001, D-002, D-003, D-007, D-008, D-009]
created: 2026-10-10
---

# TASK-009: Website login and roadmap progress

## Goal
Allow a learner to sign in, track roadmap items, and resume progress across devices using MongoDB Atlas.

## Context
`docs/architecture.md` (Netlify Functions and MongoDB layers), `docs/decisions.md` (D-001 Atlas, D-002 auth, D-003 project layout, D-007 backend layering), `content/aws-saa-c03/roadmap.md`, `content/MCP/roadmap.md`, and `src/frontend/pages/Roadmap/CourseRoadmapPage.tsx`. Depends on the Netlify function/deployment foundation in TASK-004 and TASK-005.

## Scope
- In: integrate the selected website identity provider; verify identity in Netlify Functions; persist per-user roadmap item status in Atlas; define stable IDs for trackable roadmap items; provide interactive status controls, per-module/overall completion, and a continue/resume destination; preserve public read-only roadmap browsing.
- Out: AI chat and quiz history; MCP OAuth; admin/authoring tools; public social profiles or shared progress; guest-to-account migration; dependency graph visualization; changes to course content unrelated to stable progress IDs.

## Acceptance criteria
- [ ] Given a signed-out visitor, when they open either roadmap, then they can browse it without an account and cannot read or change another user's saved progress.
- [ ] Given a signed-in learner, when they mark a trackable item `in_progress` or `completed`, then the status is saved to Atlas and remains after reload and sign-in on another device.
- [ ] Given a learner with saved statuses, when they view a roadmap, then overall and per-module completion counts are calculated from the current trackable items and a continue action opens their next in-progress item (or the first incomplete item when none is in progress).
- [ ] Given requests to the progress API, when the identity token is absent, invalid, or expired, then protected reads and writes are rejected; the API derives the owner from the verified identity and never trusts a client-supplied user ID.
- [ ] Given two different signed-in accounts, when either account requests or changes progress, then it can access only its own records.
- [ ] Given duplicate updates for one user/roadmap/item, when persisted, then the unique `(userId, roadmapId, itemId)` key prevents duplicate records and an update changes the existing status.
- [ ] Given invalid roadmap IDs, item IDs, or status values, when submitted, then the API rejects the request with a client error and does not write to Atlas.
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

## Notes
- D-001 is accepted: progress uses MongoDB Atlas.
- D-002 is accepted. Identity was Clerk (D-008); TASK-010 replaces it with the site's own auth (D-009): email + password and Google, session in an httpOnly cookie. This is separate from MCP Module 7 OAuth.
- Implemented code includes the progress endpoint and the minimal Netlify function routing/config needed by TASK-009. TASK-004's health endpoint/footer and TASK-005's connected site/deploy checks remain separate work; local and production callback behavior cannot be marked complete until Google OAuth/Atlas/Netlify settings are configured.
- No connection string, username, password, or token belongs in this task, Git, chat, or frontend code. The ignored `atlas-credentials.env` file was not read or reused.
- The Atlas credentials were reported exposed in a conversation attachment. Rotate the Atlas database user's password before configuring local development or Netlify; put the replacement only in `.env` and server-side Netlify environment settings. Confirm Atlas network access is compatible with the chosen Netlify plan; avoid a broad public allow-list for production where fixed egress is available.
- Roadmap IDs are stored in `src/shared/roadmapProgress.ts`; IDs are independent of checklist wording. When adding/removing a checklist line, update the manifest's source-line lookup while preserving IDs for existing items.
- Remaining completion work: configure the Google OAuth client and `JWT_SECRET` (see `docs/auth-setup.md`), rotate and configure Atlas credentials, run the app with Netlify Functions, and exercise deploy-preview/production callbacks once TASK-005 is connected.
