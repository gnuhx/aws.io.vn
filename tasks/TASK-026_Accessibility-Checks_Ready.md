---
id: TASK-026
type: chore
module: none
decisions: []
created: 2026-10-13
---

# TASK-026: Automated accessibility checks on pages

## Goal
Common accessibility problems (missing labels, bad contrast, wrong roles, missing alt text) fail a test instead of being shipped.

## Context
Pages already use Testing Library queries by label/role, which helps. No automated a11y rule check exists. Can later move into Playwright (TASK-025) with `@axe-core/playwright` for real-browser contrast checks.

## Scope
- In: `vitest-axe` (axe-core) in the frontend test setup; one a11y test per page (Home, Topic, Lesson, Roadmap, Auth, Settings, NotFound) rendering the page with mocked API data and asserting no violations
- Out: colour contrast (jsdom can't compute it; do it in TASK-025); manual screen-reader testing

## Acceptance criteria
- [ ] Given each page, when its a11y test runs, then axe reports no violations (or found ones are fixed / listed in Notes)
- [ ] Given an `<input>` without a label added to a page, when tests run, then the a11y test fails naming the rule

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | each page rendered | no violations | unit |
| 2 | remove a label on AuthPage | fails with `label` rule | manual |
