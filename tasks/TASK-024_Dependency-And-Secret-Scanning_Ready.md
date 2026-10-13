---
id: TASK-024
type: chore
module: none
decisions: []
created: 2026-10-13
---

# TASK-024: Dependency and secret scanning in CI

## Goal
Known-vulnerable dependencies and accidentally committed secrets are caught on the PR, before merge.

## Context
The repo root holds real credentials locally (`atlas-credentials.env`, `client_secret_*.json`, `.env`); `.gitignore` covers them today, but one rename or `git add -f` would leak them. Netlify's own secret scan already caught a false positive once (`.claude/lessons/netlify-secrets-scan-env-example.md`). Depends on TASK-019.

## Scope
- In: `.github/dependabot.yml` (npm + github-actions, weekly, grouped minor/patch); CI step `npm audit --omit=dev --audit-level=high`; gitleaks step on every PR (scan the PR diff); allow-list for `.env.example` placeholders
- Out: SAST tools (CodeQL) — optional later; rotating any secrets

## Acceptance criteria
- [ ] Given a PR adding a file containing a MongoDB URI with a password, when CI runs, then the gitleaks check fails
- [ ] Given `.env.example` placeholders, when CI runs, then no false positive
- [ ] Given a high-severity advisory in a production dependency, when CI runs, then the audit step fails
- [ ] Given a week passes, when Dependabot runs, then it opens at most one grouped PR per ecosystem

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | PR with fake `mongodb+srv://user:pass@...` | gitleaks red | manual |
| 2 | PR touching `.env.example` | green | manual |
| 3 | current dependencies | audit green (or listed) | manual |

## Notes
- Dependabot opens PRs on GitHub (outward-facing): confirm before enabling.
