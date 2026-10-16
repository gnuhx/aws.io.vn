# Users integration test fails with `DuplicateEmailError`

- Check: `npm run test:integration` (CI "verify" job)
- Last seen: 2026-10-16

## What happened
`users.integration.test.ts` > "persists user fields and applies defaults…" threw `DuplicateEmailError` at `users.ts` `create`. The tests in a file share one MongoDB database (`createMongoTestDatabase` runs in `beforeAll`), and both tests used the `user()` helper's default email `learner@example.com`. The first test had already inserted it, so the unique email index rejected the second insert. The repository was right; the test data collided.

## How to fix
Give each test that creates a user its own email (or clean the collection between tests). Don't reuse the helper's default email across tests in the same file.
