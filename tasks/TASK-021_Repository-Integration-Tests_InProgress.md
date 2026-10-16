---
id: TASK-021
type: chore
module: none
decisions: [D-007, D-010]
created: 2026-10-13
---

# TASK-021: Integration tests for repositories against a real MongoDB

## Goal
The real Mongo queries are tested (indexes, upserts, projections, user isolation), not only mocked, so a wrong filter or field name fails a test instead of production.

## Context
`src/backend/repositories/` (progress, readingProgress, users) has no tests: every endpoint test mocks the service layer. D-007 layering keeps repositories thin, so they are easy to test against a real database.

## Scope
- In: a test helper that starts an isolated MongoDB and gives each test file a fresh database; tests for each repository: unique index `(userId, roadmapId, itemId)`, `setStatus` upsert keeps `createdAt` and updates `updatedAt`, `listStatuses` returns only that user's records, `clearStatus` removes one record, users lookup by email/Google ID, reading progress save/resume; runs in CI
- Out: Atlas-specific features (vector search, M4); performance tests

## Acceptance criteria
- [ ] Given no Atlas credentials, when I run the integration tests, then each test file uses a fresh database on an ephemeral local MongoDB and never contacts Atlas
- [ ] Given two users, when each sets a status, then each `listStatuses` returns only their own
- [ ] Given `setStatus` called twice, when I read the record, then `createdAt` is unchanged and `updatedAt` is newer
- [ ] Given a duplicate progress key, when MongoDB receives the second record, then its unique index rejects it
- [ ] Given a user account, when the repository looks it up by email or Google subject, then it returns only that matching account
- [ ] Given saved reading progress, when the learner resumes or deletes their positions, then the latest position is returned and another user's data remains unchanged
- [ ] Given CI, when a pull request workflow runs, then the repository integration suite runs as a separate named step and failures fail the `CI / verify` check

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | run with Atlas variables unset or populated with a real Atlas URI | helper overwrites them with a loopback URI; a unique database is created for each file and then removed | integration |
| 2 | insert duplicate `(userId, roadmapId, itemId)` directly | duplicate key error from the real unique index | integration |
| 3 | `setStatus` twice for one item, then read it | one record, `createdAt` stable, `updatedAt` newer | integration |
| 4 | `listStatuses` for user B after user A saves the same item | B receives only B's record | integration |
| 5 | `clearStatus` for one item | only that item for that user is removed | integration |
| 6 | find users by email and Google subject | corresponding account is returned; unknown values return `null` | integration |
| 7 | save and resume reading progress, then delete for user A | latest position is returned; user B's position remains | integration |
| 8 | CI pull request | separate repository integration step passes or gates the PR | CI |

## Notes
- D-010 is accepted: use `mongodb-memory-server-core`, one real temporary `mongod` and fresh database per test file; run a separate Vitest project and CI step.
- The helper replaces `MONGODB_URI` and `MONGODB_DB_NAME` before repository calls and deletes them during teardown, so tests never inherit Atlas credentials or target Atlas.
- `clients/mongo.ts` caches the connection; `closeMongo()` now closes and clears it for test teardown.
- Unit and coverage scripts only run the existing frontend/backend unit projects. CI runs repository integration tests in a separate step; the required check gates the PR.
- The MongoDB binary is downloaded on first test run and cached by GitHub Actions for later CI runs.
- GitHub branch protection is configured outside this repository (TASK-019); once enabled for `CI / verify`, the integration step contributes to the PR merge gate.
