# Proposal: docs layout + idea → task → ship workflow

**Status:** Proposed, waiting for your decision
**Date:** 2026-10-02
**Nothing below is applied yet.** Tick the boxes in [Decide](#decide) and I'll apply what you accept.

---

## 1. The problem

- Ideas and decisions get lost. Six months later you won't remember *why* the quiz runs in a background function.
- Tasks go straight from "idea" to code, so scope grows mid-task and "done" is fuzzy. This is worse with Claude, which happily builds more than you asked for.
- Hotfixes and features need different information, but today they'd go through the same door.

## 2. The proposal in one picture

```
idea ──► /new-task (triage) ──┬─► needs a decision? ──► decisions.md (D-xxx Proposed → Accepted) ──┐
                              │                                                                      │
                              ├─► feature ──► GitHub issue (task.md)  ◄─────────────────────────────┘
                              ├─► chore   ──► GitHub issue (task.md, light)
                              └─► hotfix  ──► GitHub issue (bug.md)
                                                │
                                   ready-check passes? ── no ──► label status:needs-info
                                                │ yes
                                   /new-feature #N ──► branch ──► plan (plan mode) ──► you approve
                                                │
                                   /ship ──► PR "Closes #N" ──► criteria ticked ──► merge
```

Three homes, each with one job:

| Home | Holds | Lifetime |
|---|---|---|
| `docs/roadmap.md` | The learning plan (modules, checkboxes) | Whole course |
| `docs/decisions.md` | Why things are the way they are | Forever, never deleted |
| GitHub issues | Individual tasks with goal, scope, criteria, tests | Until closed |

---

## 3. Target repository layout

`[now]` = create now (plain files, no Claude Code features).
`[Mx]` = created in that roadmap module, as part of its lab.

```
aws.io.vn/
├── CLAUDE.md                        [M2] always loaded: commands, rules, "Current module" line
├── CLAUDE.local.md                  [M2] gitignored, personal
├── .mcp.json                        [M5]
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml               [now] disables blank issues
│   │   ├── task.md                  [now] feature / chore
│   │   └── bug.md                   [now] hotfix
│   ├── pull_request_template.md     [now]
│   └── workflows/                   [M6] CI, Claude Action, auto-ingest
├── .claude/
│   ├── settings.json                [M3]
│   ├── commands/
│   │   ├── new-task.md              [M3] idea → triage → filled template → gh issue create
│   │   ├── new-feature.md           [M3] issue → ready-check → branch → plan → wait
│   │   ├── ship.md                  [M3] checks → commit → PR "Closes #N"
│   │   └── eval.md                  [M6]
│   ├── agents/                      [M4]
│   └── skills/                      [M4]
├── content/                         [done] lessons, ingested for Q&A + quizzes
│   ├── aws-saa-c03/
│   ├── agentic-ai-code/
│   ├── context-engineering/
│   └── reactjs/
└── docs/
    ├── README.md                    [now] index: one line per file
    ├── roadmap.md                   [done] the plan, edit in place
    ├── decisions.md                 [now] why things changed
    ├── architecture.md              [now] from DESIGN.md
    ├── quiz-schema.md               [now] from DESIGN.md (has real content already)
    ├── conventions.md               [M2] not now, empty docs mislead Claude
    ├── chat-api.md                  [M2] not now, same reason
    └── LESSON_TEMPLATE.md           [done]
```

**Why not build the `.claude/` commands now:** writing them is the Module 3 lab. If I write them, you skip the lesson.
The templates and `decisions.md` are plain Markdown/GitHub files, so creating them now costs no learning.

### Where today's `DESIGN.md` goes

| Section of DESIGN.md | Moves to |
|---|---|
| Features, architecture diagram, key decisions, repo structure, `content/` vs `docs/`, collections, vector index, security & cost | `architecture.md` |
| Quiz Zod schema | `quiz-schema.md` |
| Operating principles, concept map, "re-check against current docs" | top of `roadmap.md` |
| Open questions (Atlas? login? repo shape?) | `decisions.md` as D-001…D-003 |

Then `DESIGN.md` is deleted, so no two docs say the same thing.

---

## 4. Triage: what kind of thing is this idea?

`/new-task` (built in M3) asks you questions until it can sort the idea:

| Type | When | Goes to | Branch |
|---|---|---|---|
| **Decision** | 2+ viable options; or touches architecture, data schema, security, or money; or reverses an earlier decision | `decisions.md` | none, never coded directly |
| **Feature** | new behavior for a user or for you | issue from `task.md` | `feat/<N>-<slug>` |
| **Chore** | refactor, deps, docs; no behavior change | issue from `task.md` (Acceptance = "nothing observable changes" + checks pass) | `chore/<N>-<slug>` |
| **Hotfix** | something that worked is now broken | issue from `bug.md` | `hotfix/<N>-<slug>` from `main` |

Rule of thumb: **if you can't write the "Out" line of Scope, it's not a task yet, it's a decision.**

Until M3, you do the same triage by hand: open the issue on GitHub and pick the template.

---

## 5. decisions.md

Newest first. Never delete an entry. If a decision is reversed, add a new one with `Supersedes D-xxx`.
Rejected ideas stay too, because "why didn't we do X?" is the question you'll ask most.

```md
# Decisions

Status: Proposed → Accepted | Rejected | Superseded by D-xxx

## D-003 · 2026-10-02 · Proposed
**Question:** Single folder, or separate client/ + server/?
**Options:** ...
**Decision:** _open_
**Consequences:** decides paths in architecture.md and CLAUDE.md
**Tasks:** —
```

Accepted entry, example:

```md
## D-007 · 2026-11-10 · Accepted
**Question:** How to run quiz generation, which can exceed Netlify function time limits?
**Options:** (a) small batches + streaming; (b) background function + jobs collection + polling
**Decision:** (b). Generation measured at ~40s for 10 questions; batching made questions repeat.
**Consequences:** new `jobs` collection; quiz page needs a polling state.
**Tasks:** #12, #13
```

Seed entries from the open questions in today's design:

- **D-001** Is MongoDB Atlas or self-hosted? (affects Module 5 vector search)
- **D-002** Does the site have login/users? (affects Module 7 quota + history)
- **D-003** Repo shape: single folder, or `client/` + `server/`?

---

## 6. The ready-check (Definition of Ready)

Before `/new-feature #N` writes a plan, it checks the issue. **Any failure, then no plan:** it labels the issue `status:needs-info` and says what's missing.

- [ ] **Goal** is one sentence.
- [ ] **Scope → Out** has at least one line.
- [ ] Every acceptance criterion is *Given / When / Then* with an **observable** result. "Works well" or "is fast" fails; "responds in < 2s for 10 questions" passes.
- [ ] Every criterion has **at least one test case**.
- [ ] **Notes** has no blocking open question. If it has one, it becomes a `decisions.md` entry first.
- [ ] Hotfix only: reproduce steps are filled in and a regression test is listed.

And the Definition of Done that `/ship` checks:

- [ ] All acceptance criteria ticked in the PR
- [ ] Every test case run; unit tests committed
- [ ] lint + typecheck + test pass
- [ ] Docs updated if behavior or an API changed; `decisions.md` updated if a decision was made along the way

---

## 7. Labels

| Label | Meaning |
|---|---|
| `type:feature` `type:chore` `type:hotfix` | what kind of work |
| `status:needs-info` | failed the ready-check |
| `status:ready` | passed, can be picked up |
| `module:M1` … `module:M7` | which roadmap module it belongs to (optional) |

`status:in-progress` isn't needed, because an open PR with `Closes #N` already shows that.

---

## 8. Template text (exact files)

### `.github/ISSUE_TEMPLATE/task.md`

```md
---
name: Task (feature / chore)
about: New behavior or a no-behavior-change chore. Must pass the ready-check before work starts.
title: "[feat] "
labels: ["type:feature", "status:needs-info"]
---

## Goal
One sentence: what changes for the user (or for you), and why.

## Context
Links to docs, related files, roadmap module, decisions. Example: docs/chat-api.md, Module 5 step 5, D-007.

## Scope
- In: what this task includes
- Out: what it deliberately doesn't (prevents scope creep, for you and for Claude)

## Acceptance criteria
- [ ] Given <situation>, when <action>, then <observable result>
- [ ] ...

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | ... | ... | unit / manual / eval |

## Notes
Open questions, risks, decisions made along the way.
```

### `.github/ISSUE_TEMPLATE/bug.md`

```md
---
name: Bug / hotfix
about: Something that worked is broken. Smallest fix + regression test; refactors go in a follow-up task.
title: "[fix] "
labels: ["type:hotfix", "status:needs-info"]
---

## What's broken
Where, since when, who is affected.

## Reproduce
1. ...
2. ...

## Expected vs actual
- Expected: ...
- Actual: ...

## Severity
blocks users / degraded / cosmetic

## Root cause
_Fill in while fixing._

## Fix scope
- In: the smallest change that fixes it
- Out: refactors and "while I'm here" changes, which go in a follow-up task

## Regression test
- [ ] A test that fails before the fix and passes after: ...

## Notes
```

### `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
```

### `.github/pull_request_template.md`

```md
Closes #

## What changed
One or two lines.

## Acceptance criteria
Copy from the issue and tick each one.
- [ ] ...

## How I tested
| # | Test case | Result |
|---|---|---|
| 1 | ... | pass |

## Checklist
- [ ] lint + typecheck + test pass
- [ ] Docs updated (or not needed)
- [ ] decisions.md updated (or no decision was made)
- [ ] Nothing outside the issue's Scope → In
```

---

## 9. Roadmap changes

Add to **Module 3 lab** (after the `new-feature.md` step):

- [ ] Write `.claude/commands/new-task.md`: takes an idea → triages (decision / feature / chore / hotfix) → asks until the template is filled → runs the ready-check → `gh issue create` with the right template and labels. A decision goes to `decisions.md` instead.
- [ ] Make `/new-feature` take an issue number: `gh issue view N` → ready-check → branch `feat|hotfix|chore/<N>-<slug>` → plan → stop.
- [ ] Make `/ship` fill the PR template and include `Closes #N`.
- [ ] Run one feature **and** one hotfix through the full flow.

Add to **Module 2 lab** (`CLAUDE.md` step):

- [ ] Copy the ready-check and Definition of Done (§6) into `docs/conventions.md` under a "Task workflow" heading.
- [ ] Add to `CLAUDE.md` a `Current module: M2` line and one rule: "Don't start coding without an issue that passes the ready-check in docs/conventions.md." (Exact wording is decided in M2.)

---

## 10. Trade-offs

| For | Against |
|---|---|
| Decisions and the reasons behind them survive | Some overhead per task: a small task still needs an issue |
| Claude gets a written scope and criteria, so less wandering | Tasks live on GitHub, so you need network + `gh` to see them |
| Hotfixes stay small and always add a regression test | Writing good Given/When/Then takes practice at first |
| Issues feed Module 6 directly (`@claude` on an issue → PR) | |

**Lighter alternative** if this feels heavy: skip GitHub issues; keep tasks as checkboxes in `roadmap.md` and use `decisions.md` only.
You lose the ready-check and the M6 issue → PR flow.

---

## Decide

Tick what you accept, add notes, then tell me "apply".

- [ ] A. Docs restructure: `DESIGN.md` → `architecture.md` + `quiz-schema.md` + top of `roadmap.md`
- [ ] B. `docs/decisions.md` with D-001…D-003 seeded
- [ ] C. `.github/ISSUE_TEMPLATE/` (`task.md`, `bug.md`, `config.yml`) + `pull_request_template.md`
- [ ] D. Create the labels on GitHub (`gh label create …`)
- [ ] E. Roadmap edits (Module 2 + Module 3 additions in §9)
- [ ] F. Or: the lighter alternative instead of C/D

Notes:
