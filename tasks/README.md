# Tasks

Every piece of work is one file here. Decisions don't go here: they go in [docs/decisions.md](../docs/decisions.md).
Full flow, triage, ready-check and Definition of Done: [roadmap → Task workflow](../docs/roadmap.md#task-workflow-idea--decision--task--ship).

## File name

```
TASK-<NNN>_<Title-Kebab>_<Status>.md
TASK-004_Copy-Answer_Ready.md
```

- `NNN`: 3 digits, next = highest existing number + 1. Never reused, even for dropped tasks.
- `Title-Kebab`: short, Title-Case words joined by `-`. Doesn't change after creation.
- `Status`: one of the values below. **The file name is the only place status lives.**

## Status

| Status | Meaning | Next |
|---|---|---|
| `NeedsInfo` | Failed the ready-check; the file's Notes say what's missing | `Ready` or `Dropped` |
| `Ready` | Passed the ready-check, can be picked up | `InProgress` |
| `InProgress` | Branch exists, work started | `Done` or back to `Ready` |
| `Done` | PR merged | — |
| `Dropped` | Won't do; the reason is in Notes | — |

Change status by renaming with git so history follows the file:

```bash
git mv tasks/TASK-004_Copy-Answer_Ready.md tasks/TASK-004_Copy-Answer_InProgress.md
git log --follow tasks/TASK-004_Copy-Answer_InProgress.md   # full history across renames
```

## Referencing a task

Because the file name changes with status, **refer to tasks by ID** (`TASK-004`), not by path:
in branches (`feat/004-copy-answer`), PRs (`Task: TASK-004`), and `decisions.md` (`Tasks: TASK-004`).
To find the file: `ls tasks/TASK-004_*`.

## Finding work

```bash
ls tasks/*_Ready.md        # what can be picked up
ls tasks/*_InProgress.md   # what's open
ls tasks/*_NeedsInfo.md    # what's waiting on answers
```

## Templates

- [_TEMPLATE.md](_TEMPLATE.md): feature or chore
- [_TEMPLATE-BUG.md](_TEMPLATE-BUG.md): hotfix
