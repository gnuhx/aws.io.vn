# Architecture

How the aws.io.vn AI Study Assistant works. For why specific choices were made, see [decisions.md](decisions.md); for the build plan, see [roadmap.md](roadmap.md).

An AI study assistant for the aws.io.vn learning site. Learners read lessons, ask questions answered **only from the lesson material** (with citations), and generate quizzes to test themselves.

**Stack:** React + TS (Vite) · Node TS (Netlify Functions) · MongoDB Atlas · OpenAI (embeddings + content generation)

## Features

| Feature | What it does |
|---|---|
| Lesson site | Renders course material from `content/` |
| Q&A mode | Chat widget answers only from the material, cites lesson links, refuses when nothing relevant is found |
| Quiz mode | Generates a quiz from the material (JSON → Zod validated), user takes it, gets graded with explanations |
| Progress | Stores attempts, "retry wrong questions", per-topic progress page |
| `lesson-search` MCP server | Lets Claude Code search the same lesson index the site uses |

## System overview

```
[You] content/*.md|html ─► src/backend/scripts/ingest.ts ─► parse + chunk + embed ─► MongoDB Atlas (vector index)
                                                                              │
[User] ChatWidget (React) ─SSE─► Netlify Function /api/chat ──retrieve top-k──┘
                                   ├─ Q&A mode: answer only from the material + cite lesson links
                                   └─ Quiz mode: generate JSON → Zod validate → retry → take quiz → grade
                                   + quota / rate limit / daily cost ceiling
[Claude Code] ─MCP (stdio)─► src/backend/mcp/lesson-search ─► same retrieve() function as above
```

Key decisions:

- **Ingest runs locally, not in a Netlify Function**, to avoid function timeouts. Re-runs are free thanks to a per-chunk content hash.
- **Chunk by heading, not by character count.** Never cut through a code block. Target 300–800 tokens per chunk.
- **One `retrieve()` function** shared by the chat API and the MCP server.
- **Below the score threshold, don't call the LLM.** Reply "not found in the material" instead, which saves money.
- **`content/` is the source of truth for RAG.** Claude Code is denied write access to it.
- **One Zod schema** in `src/shared/schemas/` used by both the web app and the functions. See [quiz-schema.md](quiz-schema.md).

## Repository structure

Target layout (D-003): one npm package, one Netlify site. **All source code lives in `src/`**, split into `frontend/`, `backend/` and `shared/`. Everything else at the root is config, content or docs. Folders appear as the [roadmap](roadmap.md) modules create them.

```
aws.io.vn/
├── CLAUDE.md, CLAUDE.local.md (gitignored), .mcp.json
├── package.json, vite.config.ts, eslint.config.js, netlify.toml, .nvmrc
├── tsconfig.json        references only → tsconfig.app.json (frontend, DOM) + tsconfig.node.json (backend, Node)
├── .github/
│   ├── pull_request_template.md
│   └── workflows/       CI, Claude Action, auto-ingest
├── .claude/
│   ├── settings.json, settings.local.json (gitignored)
│   ├── commands/   new-task.md, new-feature.md, ship.md, eval.md
│   ├── agents/     code-reviewer.md, quiz-writer.md, log-triage.md, review/security.md
│   ├── skills/     quiz-question-format/{SKILL.md, checklist.md, examples.json}
│   └── agent-memory/  (created when memory: project is enabled)
├── content/        aws-saa-c03/, context-engineering/, reactjs/, agentic-ai-code/
├── tasks/          TASK-NNN_<Title>_<Status>.md, _TEMPLATE.md, _TEMPLATE-BUG.md
├── docs/           roadmap.md, decisions.md, architecture.md, quiz-schema.md, repo-map.md, chat-api.md, conventions.md
├── evals/          golden.jsonl, results/
├── data/seed-exams/
└── src/
    ├── frontend/        Vite root: index.html, main.tsx, router.tsx, styles/, public/
    │   ├── pages/       Home/, Quiz/  (Page.tsx + Page.module.css per folder)
    │   └── components/  ChatWidget/, Footer/
    ├── backend/
    │   ├── functions/   Netlify Functions: health.ts, chat.ts, generate-quiz.ts, _lib/{rag,openai,quota}/
    │   ├── scripts/     ingest.ts, eval-retrieval.ts, eval-generation.ts, validate-quiz.ts, smoke.ts (run with tsx)
    │   └── mcp/lesson-search/
    └── shared/          code used by both sides; must run in browser and Node
        └── schemas/     quiz.ts, lesson.ts (Zod)
```

Import rules (enforced by ESLint): `frontend/` and `backend/` never import each other; both may import `shared/` (alias `@shared/*`).

### `content/` vs `docs/`

| Folder | Holds | Read by |
|---|---|---|
| `content/<topic>/` | Lesson material. One file per lesson, following [LESSON_TEMPLATE.md](LESSON_TEMPLATE.md) | Learners (site) and the ingest pipeline |
| `docs/` | Docs about the project itself | You and Claude Code (loaded on demand from `CLAUDE.md`) |

Course topics: `aws-saa-c03`, `context-engineering`, `reactjs`, `agentic-ai-code`.

## Data

MongoDB collections:

| Collection | Shape | Introduced |
|---|---|---|
| `chunks` | `{ docId, topic, path, url, title, headingPath[], text, tokenCount, embedding[], contentHash, updatedAt }` | M4 |
| `jobs` | `{ status: queued \| running \| done \| failed, ... }`, only if quiz generation goes background | M5 |
| `usage` | `{ userId \| ipHash, date, chatCount, quizCount, tokens }`, updated atomically with `$inc` | M7 |
| `attempts` | `{ userId, quizId, answers, score, wrongQuestionIds }` | M7 |

Atlas vector index on `chunks` (`chunks_vec`):

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "topic" }
  ]
}
```

Quiz and question shape: [quiz-schema.md](quiz-schema.md).

## Security and cost

Threat model:

1. Being used as a free OpenAI proxy.
2. Prompt injection.
3. Leaked keys.
4. Wallet-draining spam.

Countermeasures:

- Auth that reuses the site's existing auth (see D-002 in [decisions.md](decisions.md)).
- Per-user/IP quotas. Example: guests get 5 chats/day; signed-in users get 30 chats + 3 quizzes/day.
- Input length limits and `max_tokens`.
- A daily cost ceiling that disables Quiz mode, plus the OpenAI dashboard hard limit as the final layer.
- Retrieved context wrapped in delimiters and treated as data, never as instructions. This also applies to MCP tool output.
- Keys only in `.env` and a secret manager. Never in chat, git or `CLAUDE.md`.
