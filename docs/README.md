# Docs

Project docs for the aws.io.vn AI Study Assistant. Lesson material lives in [`content/`](../content/), not here.

| File | What it's for |
|---|---|
| [roadmap.md](roadmap.md) | The plan: modules, checklists, task workflow. Edit in place, tick as you go |
| [decisions.md](decisions.md) | Why things are the way they are. Open questions live here until decided |
| [architecture.md](architecture.md) | How the system works: diagram, repo structure, data, security |
| [quiz-schema.md](quiz-schema.md) | Zod schema for generated quizzes |
| [LESSON_TEMPLATE.md](LESSON_TEMPLATE.md) | Shape every lesson in `content/` follows |

Added by later modules:

| File | Module |
|---|---|
| `repo-map.md` | M1 |
| `chat-api.md`, `conventions.md` | M2 |

## Where things go

| You have… | Put it in |
|---|---|
| A question with 2+ options, or a choice you'll want to explain later | [decisions.md](decisions.md) |
| A piece of work | a task file in [`tasks/`](../tasks/README.md), see [roadmap → Task workflow](roadmap.md#task-workflow-idea--decision--task--ship) |
| A new lesson | `content/<topic>/<number>-<short-slug>.md`, from [LESSON_TEMPLATE.md](LESSON_TEMPLATE.md) |

## Archive

`original & brainstorm/` holds source material and proposals these docs were built from
(`temp-overview.md`, `temp-proposal.md`). It is **not maintained**. If it disagrees with the files above, the files above win.
