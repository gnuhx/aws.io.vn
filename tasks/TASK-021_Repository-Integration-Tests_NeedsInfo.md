---
id: TASK-021
type: chore
module: none
decisions: [D-007]
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
- [ ] Given no Atlas credentials, when I run the integration tests, then they run against a local/ephemeral MongoDB and never touch Atlas
- [ ] Given two users, when each sets a status, then each `listStatuses` returns only their own
- [ ] Given `setStatus` called twice, when I read the record, then `createdAt` is unchanged and `updatedAt` is newer
- [ ] Given CI, when the workflow runs, then integration tests run and gate the PR

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | insert duplicate `(userId, roadmapId, itemId)` directly | duplicate key error | integration |
| 2 | `setStatus` twice | one record, createdAt stable | integration |
| 3 | `listStatuses` for user B | no user A records | integration |
| 4 | `clearStatus` | only that item removed | integration |

## Notes
- Needs decision: `mongodb-memory-server` (works locally and in CI, ~100 MB download once) vs a `services: mongo` container in GitHub Actions (CI only; local needs Docker). Recommendation: memory server.
- Needs decision: separate Vitest project `integration` (`npm run test:integration`) or part of `npm test`? Recommendation: separate project, included in `verify` once it is fast enough (< 20 s).
- `clients/mongo.ts` caches the connection in a module variable; tests need a way to reset it (`vi.resetModules` or an exported reset for tests).
