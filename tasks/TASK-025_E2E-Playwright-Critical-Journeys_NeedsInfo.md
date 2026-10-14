---
id: TASK-025
type: chore
module: none
decisions: [D-006]
created: 2026-10-13
---

# TASK-025: Playwright E2E for critical journeys (desktop, iPad, phone)

## Goal
The few journeys that must never break are clicked through in a real browser on desktop, tablet and phone sizes, so routing, auth cookies and layout regressions are caught before users see them.

## Context
D-006 deferred E2E "until there is UI worth clicking through"; there now is (auth, roadmap progress, resume reading, settings). TASK-017 (responsive) adds a reason to test phone/iPad viewports. TASK-006 (smoke) checks HTTP only; this checks the UI.

## Scope
- In: Playwright with projects `desktop-chrome`, `ipad`, `iphone`; journeys: (1) open a lesson deep link directly → renders; (2) register/login with email+password → lands on `?redirect=` page; (3) mark a lesson read → roadmap progress updates after reload; (4) scroll a lesson, leave, come back → resume reading offered; (5) logout → protected page redirects to login; trace + screenshot on failure as CI artifacts
- Out: Google sign-in (needs real Google; covered by unit tests); visual snapshot diffing (later); load testing

## Acceptance criteria
- [ ] Given a running app, when I run `npm run e2e`, then all journeys pass on the three projects
- [ ] Given a failing journey, when CI finishes, then the trace and screenshot are downloadable
- [ ] Given a test user, when the suite runs twice, then it still passes (tests clean up or use unique emails)

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1-5 | journeys listed in Scope | pass on 3 viewports | e2e |
| 6 | break the SPA redirect in netlify.toml | journey 1 fails | e2e |

## Notes
- Needs decision: run against what? (a) `netlify dev` + local/ephemeral Mongo inside CI (fully isolated, slower setup); (b) the Netlify deploy preview URL after deploy (real environment, needs a test database for previews so tests don't write to production data). Recommendation: (b) together with TASK-006, with a separate `MONGODB_DB_NAME` for previews.
- Needs decision: gate PRs on it, or report-only at first? Recommendation: report-only for 2 weeks to measure flakiness, then gate.
- Amend D-006 (E2E no longer deferred).
