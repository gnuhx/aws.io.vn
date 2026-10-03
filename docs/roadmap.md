# Roadmap: learning Claude Code through a real project

The module-by-module build plan for the AI Study Assistant. For how the system works, see [architecture.md](architecture.md); for why, see [decisions.md](decisions.md).

**Environment:** Ubuntu laptop + VS Code + Claude Code
**Total time:** about 35–40 hours, roughly 2–3 weeks of evening sessions.

## How to use this file

1. Each module = 1 git branch (`module-N/...`) + 1 tag when done (`module-N-done`).
2. Tick `- [ ]` directly in this file as you finish items, and commit it to the repo.
3. Mentor loop: **get the brief → work with Claude Code → submit (diff/numbers) → get reviewed → next module**.
4. The "Submit" section at the end of each module is what you paste back for review.

## Suggested pace

| Week | Modules | Hours |
|---|---|---|
| 1 | M0 + Release 0.1 + M1 + M2 + M3 | ~19–21h |
| 2 | M4 + M5 | ~12–13h |
| 3 | M6 + M7 | ~9–10h |

## Operating principles (read once, remember forever)

1. **Clean commit before every big task.** Git is your undo button.
2. **Plan mode first, code second** for anything that touches multiple files.
3. **Never blindly trust Claude's output.** Every claim about the repo must be verified by opening the real file.
4. **Keys never go into chat, git, or CLAUDE.md.** They live only in `.env` and a secret manager.
5. **No numbers, no conclusions.** `/context`, evals, hook timing, token cost: measure before saying "better".

## Concept map: everything is a way of managing context

| Knob | Tool | Learned in |
|---|---|---|
| Always loaded | `CLAUDE.md`, `CLAUDE.local.md` | M2 |
| Loaded on demand | `docs/`, skills (+ supporting files) | M2, M4 |
| Isolated context | subagents (+ `agent-memory`) | M4 |
| Connect to the outside | MCP (`.mcp.json`) | M5 |
| Package a workflow | commands, hooks, `settings.json` | M3 |
| Run without a human | headless `claude -p`, GitHub Actions | M6 |

## Task workflow: idea → decision → task → ship

Roadmap modules are the learning plan. Work outside the lab steps goes through this flow.
In Module 2 the ready-check and Definition of Done move to `docs/conventions.md`; in Module 3, `/new-task`, `/new-feature` and `/ship` automate it.

```
idea ──► triage ──┬─► needs a decision? ──► decisions.md (D-xxx Proposed → Accepted) ──┐
                  ├─► feature ──► tasks/TASK-NNN_<Title>_<Status>.md  ◄────────────────┘
                  ├─► chore   ──► tasks/ (same template, light)
                  └─► hotfix  ──► tasks/ (bug template)
                                    │
                       ready-check passes? ── no ──► _NeedsInfo (Notes say what's missing)
                                    │ yes ──► _Ready
                       branch ──► _InProgress ──► plan (plan mode) ──► you approve ──► PR "Task: TASK-NNN" ──► merge ──► _Done
```

Task files, naming and status values: [tasks/README.md](../tasks/README.md). Templates: `tasks/_TEMPLATE.md`, `tasks/_TEMPLATE-BUG.md`.

**Triage:**

| Type | When | Goes to | Branch |
|---|---|---|---|
| Decision | 2+ viable options; or touches architecture, data schema, security, or money; or reverses an earlier decision | [decisions.md](decisions.md) | none, never coded directly |
| Feature | new behavior for a user or for you | `tasks/`, `_TEMPLATE.md` | `feat/<NNN>-<slug>` |
| Chore | refactor, deps, docs; no behavior change | `tasks/`, `_TEMPLATE.md` (Acceptance = "nothing observable changes" + checks pass) | `chore/<NNN>-<slug>` |
| Hotfix | something that worked is now broken | `tasks/`, `_TEMPLATE-BUG.md` | `hotfix/<NNN>-<slug>` from `main` |

Rule of thumb: **if you can't write the "Out" line of Scope, it's not a task yet, it's a decision.**

**Ready-check** (before planning; any failure → status `NeedsInfo`, no plan):

- [ ] **Goal** is one sentence.
- [ ] **Scope → Out** has at least one line.
- [ ] Every acceptance criterion is *Given / When / Then* with an **observable** result. "Works well" fails; "responds in < 2s for 10 questions" passes.
- [ ] Every criterion has **at least one test case**.
- [ ] **Notes** has no blocking open question. If it has one, it becomes a `decisions.md` entry first.
- [ ] Hotfix only: reproduce steps are filled in and a regression test is listed.

**Definition of Done** (before merge):

- [ ] All acceptance criteria ticked in the PR
- [ ] Every test case run; unit tests committed
- [ ] lint + typecheck + test pass
- [ ] Docs updated if behavior or an API changed; `decisions.md` updated if a decision was made along the way
- [ ] Task file renamed to `_Done` in the same PR

## Re-check against current docs

Tools change fast, so verify these before starting each module instead of trusting memory:

- Claude Code install command and how it connects to VS Code
- Hook syntax (event names, how to block an action) and `permissions` rule syntax
- `.mcp.json` syntax (environment variable expansion), MongoDB MCP server package name
- `/install-github-app` and the Claude Code GitHub Action configuration
- Netlify Functions: time limits, streaming, background functions
- Atlas Vector Search: current index syntax, network access options
- OpenAI: model names, token limits, structured outputs, pricing

---

## MODULE 0: Prepare the Ubuntu machine (1–1.5h)

**Goal:** a clean environment so you don't trip on small issues in later modules.

### Checklist
- [ ] `sudo apt update && sudo apt install -y git curl build-essential`
- [ ] Install **nvm**, then `nvm install --lts`. Pin the version in `.nvmrc`.
- [ ] Install **VS Code from Microsoft's .deb / apt repo**, not snap (snap often breaks PATH in the terminal when using nvm).
- [ ] Extensions: ESLint, Prettier, **Claude Code** (VS Code extension), optionally MongoDB for VS Code.
- [ ] Install **Claude Code** following the current guide at docs.claude.com, run `claude` to sign in, then `claude doctor`.
- [ ] `gh auth login` + SSH key for GitHub.
- [ ] Netlify CLI (`npm i -g netlify-cli`), `netlify login`, `netlify link` inside the repo.
- [ ] Raise the file watcher limit for Vite/VS Code:
  `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`
- [ ] Accounts: MongoDB Atlas (free M0 tier is enough for learning), OpenAI API. **Set a hard budget limit in the OpenAI dashboard right now.**
- [ ] `.gitignore` contains `.env*`, `CLAUDE.local.md`, `.claude/settings.local.json`.
- [ ] Minimal `.claude/settings.json` with just `"deny": ["Read(./.env*)"]` so Claude can't read secrets during Module 1–2 exploration (the full permissions file comes in Module 3).

**Done when:** `node -v`, `claude --version`, `gh auth status`, `netlify status` all look good; you can run `claude` in VS Code's integrated terminal and (per current docs) connect it to the IDE to view diffs in the editor.

**Submit:** output of the 4 commands above + the current repo tree (`tree -L 2 -I node_modules`).

---

## RELEASE 0.1: Walking skeleton on Netlify (4–6h)

**Why:** the old code was removed, and Module 1 needs a real, deployed codebase to map. Keep it small: no MongoDB, OpenAI, chat or auth yet, so Modules 2–5 still have everything to teach.

**Before starting:** accept D-001…D-006 in [decisions.md](decisions.md), then rename the tasks below from `_NeedsInfo` to `_Ready`.

| Task | What |
|---|---|
| TASK-001 | Scaffold: Vite + React + TS, React Router, CSS Modules, ESLint/Prettier, `.gitignore`, `.nvmrc`, minimal `.claude/settings.json` |
| TASK-002 | Vitest + React Testing Library; `npm run verify` = lint + typecheck + test |
| TASK-003 | Lesson pages from `content/**/*.md` + content validation test |
| TASK-004 | `GET /api/health` Netlify Function + footer status |
| TASK-005 | Netlify Git deploy; build command `npm run verify && npm run build` blocks broken deploys |
| TASK-006 | Post-deploy smoke test (script + GitHub Action on deploy status) |

Order: 001 → 002 → 003 + 004 (either order) → 005 → 006.

**Automated checks after this release:**

| When | What runs | Fails → |
|---|---|---|
| Every Netlify build (preview + production) | `npm run verify`: lint, typecheck, unit + component tests, lesson frontmatter validation | build fails, previous deploy stays live |
| After every deploy | `src/backend/scripts/smoke.ts`: `/`, a lesson, `/api/health`, a deep link | red check on the commit/PR |

**Done when:** https://aws.io.vn serves one real lesson, `/api/health` is green, a PR with a failing test cannot deploy, and smoke runs on every deploy. Tag `v0.1`.

---

## MODULE 1: Onboard Claude into an existing codebase (3–4h)

**Branch:** `module-1/onboarding`

### Theory to grasp
- **Agent loop:** read → plan → call tools (Read, Grep, Glob, Edit, Bash) → observe → repeat.
- **The context window is a scarce resource.** Reading the whole repo is wrong. Targeted questions are cheaper and more accurate.
- **Plan mode** (Shift+Tab): Claude only explores and proposes; it does not edit files yet.
- Commands: `/context`, `/clear`, `/compact`, `/cost`, `/permissions`, `/help`.
- Default permission mode: every write/command asks you first. Read each approval carefully in the first session.

### Lab
1. [ ] Create the branch, commit a clean current state.
2. [ ] Put your material into `content/` by topic (`aws-saa-c03/`, `context-engineering/`, `reactjs/`, `agentic-ai-code/`). Commit.
3. [ ] Open `claude` in the VS Code terminal. Run `/context`, **record number A** (initial state).
4. [ ] Turn on plan mode. Ask Claude to map the repo: routes, how auth works, how Mongo connects, how Netlify builds/deploys, how the site currently renders md/html. **Don't let it edit files.**
5. [ ] `/context` again, **record number B**.
6. [ ] Experiment: ask the same question ("where is the Mongo connection function and where is it called from?") two ways: (a) "read the whole server folder then answer", (b) ask directly and specifically. Compare `/context`, **record number C**.
7. [ ] Save the result as `docs/repo-map.md`. **Personally verify at least 5 claims in it by opening the real files**, and fix what's wrong.
8. [ ] `/clear`, ask a repo question again, and observe that Claude has forgotten everything. This is why you need `CLAUDE.md` in Module 2. Try `/compact` on a long session to see the difference.
9. [ ] Push the branch, open the **Netlify deploy preview** URL, confirm the site still works.

**Done when:** you have a verified `repo-map.md`, 3 context numbers, and you can explain why plan mode gives better results.

**Trap:** trusting the repo map blindly. LLMs can invent very plausible paths or function names.

**Submit:** numbers A/B/C, `repo-map.md`, and **one thing Claude got wrong** about your repo.

---

## MODULE 2: Rules and docs (4–5h)

**Branch:** `module-2/rules-and-widget`

### Theory to grasp
- `CLAUDE.md` is loaded **every session**, so every line costs context permanently. Shorter means Claude follows it better.
- Belongs in `CLAUDE.md`: build/test/lint/typecheck commands, architecture in 10 lines, naming and structure conventions, **verifiable** don'ts.
- Doesn't belong: "write clean code" (meaningless), long documentation (put it in `docs/`), keys/secrets.
- On-demand loading: in `CLAUDE.md`, write "before doing X, read `docs/Y.md`".
- Layering: `~/.claude/CLAUDE.md` (personal, machine-wide) → `CLAUDE.md` (project, committed) → `CLAUDE.local.md` (just you, not committed). Inspect with `/memory`.

### Lab
1. [ ] Run `/init` to see a draft, then **cut it down and rewrite to ≤ 100 lines**. Every line must answer: "if I remove this line, where would Claude go wrong?"
   - Include a `Current module: M2` line (update it as you move on) and one rule: "Don't start coding without a task file in tasks/ that passes the ready-check in docs/conventions.md." Exact wording is yours.
2. [ ] Write docs:
   - `docs/architecture.md`: already drafted. **Trim it for Claude**: cut what Claude doesn't need, verify every path against the real repo.
   - `docs/chat-api.md` (request/response, SSE events: `token`, `citations`, `done`, `error`, error codes)
   - `docs/quiz-schema.md`: schema already there; add the 2 examples
   - `docs/conventions.md` (naming, error handling, component structure). Move the **ready-check** and **Definition of Done** from the Task workflow section above into it, under a "Task workflow" heading.
3. [ ] Create `CLAUDE.local.md` (machine paths, personal habits), confirm it's in `.gitignore`.
4. [ ] **A/B experiment:** 2 branches `exp/with-docs` and `exp/no-docs`, same prompt "add a ChatPanel component following project standards". Score on 4 criteria: right folder, right schema, right style, number of times you had to fix things. Record as a table.
5. [ ] Build the **ChatWidget** with fake data:
   - floating button on every page, open/close panel
   - fake stream through a mock `/api/chat` returning SSE
   - render markdown (react-markdown), citation chips, loading/error states, mobile-friendly
   - `aria-live` for the streaming region
6. [ ] Create `src/shared/schemas/quiz.ts` (Zod) shared by the web app and functions.
7. [ ] Deploy preview, test on your phone.

**Done when:** `CLAUDE.md` ≤ 100 lines, A/B table has numbers, widget runs on the preview.

**Traps:** `CLAUDE.md` gradually bloating; two rules contradicting each other; docs written for humans instead of for Claude (wordy, missing concrete examples).

**Submit:** `CLAUDE.md`, A/B table, screenshot of the widget.

---

## MODULE 3: Workflow automation (4h)

**Branch:** `module-3/automation`

### Theory to grasp
- **Slash command** = a packaged prompt: a `.md` file in `.claude/commands/` with frontmatter (`description`, `argument-hint`, `allowed-tools`) and the `$ARGUMENTS` variable. Project version (committed) vs personal version (`~/.claude/commands/`).
- **Permissions** in `settings.json`: `allow` / `ask` / `deny`. Principle: **narrow allows, explicit denies**.
- **Hooks:** run shell commands on events (`PreToolUse`, `PostToolUse`, `Stop`...), filtered by `matcher`. A `PreToolUse` hook can block an action.
- `settings.json` (shared, committed) vs `settings.local.json` (personal).

### Lab
1. [ ] Write `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run test:*)", "Bash(npm run lint)", "Bash(npm run typecheck)",
      "Bash(git status)", "Bash(git diff:*)", "Bash(git log:*)"
    ],
    "ask": ["Bash(git push:*)", "Bash(npm install:*)"],
    "deny": [
      "Read(./.env*)", "Bash(rm -rf:*)", "Bash(git push --force:*)",
      "Edit(./content/**)", "Write(./content/**)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npm run typecheck --silent" }] }
    ]
  }
}
```

2. [ ] **Try to violate it:** ask Claude to read `.env` and to edit a file in `content/`. Confirm both are blocked. (`content/` is protected because it's the source of truth for RAG.)
3. [ ] **Measure the hook:** how long does typecheck take? If > 3–5 seconds, move it to a `Stop` hook, or only run prettier/eslint on the file just edited.
4. [ ] Write `.claude/commands/new-feature.md`: takes a description → creates branch `feat/<slug>` → reads `CLAUDE.md` + relevant docs → presents a plan → **stops and waits for approval**.

```md
---
description: Create a feature branch and plan, wait for approval before coding
argument-hint: <feature description>
allowed-tools: Bash(git switch:*), Bash(git checkout:*), Read, Grep, Glob
---
Feature: $ARGUMENTS
1. Create branch feat/<short slug>.
2. Read CLAUDE.md and the relevant docs/.
3. Present a plan: files to change, risks, how to test. DO NOT edit code.
4. Stop and wait for my approval.
```

5. [ ] Upgrade `/new-feature` to take a **task ID** (`/new-feature 004`): find `tasks/TASK-004_*` → run the ready-check from `docs/conventions.md` (fail → `git mv` to `_NeedsInfo`, write what's missing in Notes, stop) → branch `feat|chore|hotfix/<NNN>-<slug>` by the file's `type:` → `git mv` to `_InProgress` → plan → stop.
6. [ ] Write `.claude/commands/new-task.md`: takes an idea → triages it (decision / feature / chore / hotfix) → asks until the template is filled → runs the ready-check → writes `tasks/TASK-<next>_<Title>_<Ready|NeedsInfo>.md`. A decision becomes a `docs/decisions.md` entry instead of a task.
7. [ ] Write `/ship`: run lint + typecheck + test → `git mv` the task file to `_Done` → summarize the diff → commit using conventional commits → push → `gh pr create` filling `.github/pull_request_template.md`, with `Task: TASK-NNN` and the task's acceptance criteria ticked.
8. [ ] Write 1 **personal** command in `~/.claude/commands/` (e.g. `/standup`) to see the scope difference.
9. [ ] Run the full workflow twice, `/new-task` all the way to a merged PR:
   - a feature: a "Copy answer" button in the chat
   - a hotfix: any real bug you've hit so far (with a regression test)

**Done when:** a feature and a hotfix each go from idea to PR without typing git by hand; an incomplete task is stopped by the ready-check; deny rules are proven to work; the hook doesn't noticeably slow the session.

**Traps:** overly broad allows like `Bash(*)`; hooks causing loops; long commands stuffing context; `/new-task` filling in acceptance criteria *for* you instead of asking (vague criteria pass through unnoticed).

**Submit:** `settings.json`, 3 commands, both PR links, one task the ready-check rejected, measured hook time.

---

## MODULE 4: Subagents, Skills and the ingest pipeline (5–6h)

**Branch:** `module-4/agents-skills-ingest`

### Theory to grasp
- **Subagent:** its own context, restricted tools, returns only a compact result to the main session. Good for noisy work (review, search, log analysis). Manage with `/agents`. With `memory: project` enabled it accumulates notes in `.claude/agent-memory/<name>/MEMORY.md`.
- **Skill:** a folder containing `SKILL.md` (frontmatter + instructions). The `description` decides when Claude loads it automatically. Supporting files (`checklist.md`...) are only loaded when needed.
- **Choosing the tool:**

| Need | Use |
|---|---|
| A repeated workflow you trigger manually | Command |
| Knowledge/standards Claude applies on its own in the right context | Skill |
| Heavy/noisy work needing isolated context, or a specialized role | Subagent |

- **RAG ingest:** an embedding = a numeric vector representing meaning (`text-embedding-3-small` gives 1536 dimensions; check current docs). Chunk by **heading**, not by character count. Attach metadata. Use a **content hash** so re-runs cost no tokens.

### Lab A: Agents and Skills
1. [ ] `.claude/agents/code-reviewer.md` with read-only tools:

```md
---
name: code-reviewer
description: Review the current diff for logic bugs, security issues and project-standard compliance. Use after finishing a feature.
tools: Read, Grep, Glob, Bash
model: sonnet
---
You are a strict reviewer. Read CLAUDE.md and docs/conventions.md first.
Run `git diff main...HEAD`. Return: definite bugs / risks / suggestions, each with file:line.
```

2. [ ] `.claude/agents/review/security.md` (subfolder): focused on injection, leaked keys, missing input validation.
3. [ ] Run `code-reviewer` on the ChatWidget diff. Check `/context` in the main session: did it bloat?
4. [ ] Enable `memory: project` for one agent (e.g. `log-triage`, which reads function error logs). Run it twice, open `MEMORY.md` and see what it wrote on its own. Decide whether to commit or ignore it.
5. [ ] Skill `quiz-question-format/`:
   - `SKILL.md`: when to use it, concise question format
   - `checklist.md`: 1 clearly correct answer, plausible distractors, no "all of the above", explain why wrong answers are wrong, tag the SAA-C03 domain...
   - `examples.json`: 3 model questions
   Verify: ask Claude to "write 3 questions about VPC" **without** naming the skill, and see whether it activates on its own.

### Lab B: Ingest pipeline
6. [ ] `chunks` collection schema:
   `{ docId, topic, path, url, title, headingPath[], text, tokenCount, embedding[], contentHash, updatedAt }`
7. [ ] Parser: **md** (gray-matter for frontmatter, split by heading), **html** (cheerio; drop nav/script/style/footer, take `main`/`article`). Map file path → lesson URL on the site.
8. [ ] Chunker: by heading; split long sections by paragraph; **never cut through a code block**; target chunk size about 300–800 tokens.
9. [ ] Embed in batches with retry + backoff; upsert by `contentHash`; delete chunks of removed files.
10. [ ] `src/backend/scripts/ingest.ts` (run locally with `tsx`) with a `--dry-run` flag: prints file count, chunk count, and **estimated tokens** before calling the API.
11. [ ] Test parser/chunker with vitest using a few fixture files.
12. [ ] Have `code-reviewer` review the ingest script.

**Done when:** a second ingest run makes **0 embedding calls**; dry-run prints an estimated cost; the skill auto-activates; you can tell command/skill/subagent apart.

**Traps:** ingest runs locally, not in a Netlify Function (avoid timeouts). Junk HTML (menus, footers) leaking into chunks and polluting retrieval. Chunks exceeding the embedding model's token limit.

**Submit:** 2 agent files, the skill, `--dry-run` output, logs of two ingest runs.

---

## MODULE 5: MCP and RAG (6–7h)

**Branch:** `module-5/mcp-rag`

### Theory to grasp
- **MCP** = a protocol for connecting Claude to external tools/data. Concepts: server, tool, input schema. Transport `stdio` (local) vs HTTP. Config scopes: project (`.mcp.json`, committed) / local / user. Manage with `claude mcp add` and `/mcp`.
- **Vector search:** `$vectorSearch`, `numCandidates`, `limit`, `filter`, the `vectorSearchScore`. A score threshold decides "found or not".
- **Grounded answer:** the prompt must say "answer only from the context; if it's not there, say you don't know"; cite by chunk id.
- **Structured output:** force the LLM to return JSON per a schema, then Zod-validate again, retry with the error message on failure.
- **MCP security:** content returned from a tool is also untrusted data. Don't let it become instructions.

### Lab
1. [ ] Create a **vector index** on Atlas for the `chunks` collection:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "topic" }
  ]
}
```

2. [ ] Configure the **official MongoDB MCP server** (check the current package name), in **read-only mode**, connection string via environment variable. Ask Claude to list collections, count chunks by topic, check the index.
3. [ ] Write `src/backend/functions/_lib/rag/retrieve.ts`: embed query → `$vectorSearch` → return chunks + scores. **Create the Mongo client outside the handler** so it's reused across invocations.

```js
{ $vectorSearch: { index: "chunks_vec", path: "embedding", queryVector,
                   numCandidates: 100, limit: k, filter: { topic } } },
{ $project: { text: 1, url: 1, title: 1, score: { $meta: "vectorSearchScore" } } }
```

4. [ ] Eyeball check: 10 questions, print the top-3 chunks. Record the wrong ones (used in Module 6).
5. [ ] Real **Q&A mode** at `/api/chat`: retrieve → if the top score is below the threshold, return "not found in the material" **without calling the LLM** (saves money) → otherwise stream the answer + a `citations` event. The widget shows link chips back to lessons.
6. [ ] **Write your own MCP server `lesson-search`** (`@modelcontextprotocol/sdk`, stdio transport, Zod for input):
   - tool `search_lessons({ query, topic?, k? })`
   - tool `get_lesson_chunk({ id })`
   - test with **MCP Inspector** before wiring it into Claude
   - declare it in `.mcp.json`:

```json
{
  "mcpServers": {
    "lesson-search": {
      "command": "npx",
      "args": ["tsx", "src/backend/mcp/lesson-search/index.ts"],
      "env": { "MONGODB_URI": "${MONGODB_URI}", "OPENAI_API_KEY": "${OPENAI_API_KEY}" }
    }
  }
}
```

   - `/mcp` in Claude Code must show `connected`.
7. [ ] Subagent `quiz-writer`: uses MCP `lesson-search` + skill `quiz-question-format`, generates 2 sample SAA-C03 exams (20 questions) into `data/seed-exams/`, each question with sources. Add a `PostToolUse` hook (matcher `Write`) running `src/backend/scripts/validate-quiz.ts` to **Zod-validate the moment the file is written**.
8. [ ] **Quiz mode:** form (topic, number of questions, difficulty) → `/api/generate-quiz`:
   - retrieve in multiple rounds per sub-topic so the exam isn't lopsided
   - LLM structured output → Zod validate → on failure retry up to 2 times with the error
   - Generation is slow, so **check current Netlify docs** on time limits and streaming, then choose: (a) generate in small batches and stream progressively, or (b) background function + `jobs` collection (`queued/running/done/failed`) + frontend polling.
9. [ ] Quiz-taking page: choose answers → submit → grade → explanations + links to related lessons.

**Done when:**
- 5 questions **outside the material** are all correctly refused
- generating a 10-question quiz passes Zod on the first try ≥ 90% of the time
- Claude Code successfully calls your MCP server

**Traps:**
- stdio MCP server: **never `console.log` to stdout** (it breaks the protocol), use `console.error`.
- Netlify Functions → Atlas: network access must be configured (Netlify IPs aren't fixed); use a dedicated least-privilege user.
- Cold start + a new Mongo connection on every call is slow.

**Submit:** screenshot of `/mcp`, logs of a few Q&A exchanges (including refusals), 1 generated quiz JSON, your sync vs background decision with reasoning.

---

## MODULE 6: Autonomous agents and evals (5h)

**Branch:** `module-6/eval-and-actions`

### Theory to grasp
- **Evals = unit tests for AI systems.** "Looks fine" is not evidence.
- Metrics: retrieval **hit@k / MRR**, **groundedness** (LLM-as-judge with a rubric), **schema pass rate**, **correct refusal rate**, duplication rate between generated questions, latency and cost per request.
- The golden set is **labeled by a human**; the LLM only suggests candidates.
- **Headless:** `claude -p "..."` runs non-interactively, for scripts/CI.
- **GitHub Actions for Claude Code:** install via `/install-github-app` (check current docs), grant minimal permissions, **don't give Claude merge rights**.

### Lab
1. [ ] `evals/golden.jsonl`: 30–40 entries `{ q, expectedFiles[], type: "answerable" | "unanswerable" | "adversarial" }`. Let Claude suggest; **you review and label**.
2. [ ] `src/backend/scripts/eval-retrieval.ts`: compute hit@1/3/5, MRR; write `evals/results/<date>.json`.
3. [ ] **A/B with numbers:** compare heading-based chunks vs fixed 500-token chunks; or top-k 3 vs 6; or different score thresholds. Pick the config by the numbers, record a table.
4. [ ] `src/backend/scripts/eval-generation.ts`: generate 20 quizzes, measure schema pass rate, duplication rate, groundedness via a judge (use a cheap model, watch the cost).
5. [ ] Command `/eval`: run both scripts, compare to the previous run, **summarize regressions**.
6. [ ] GitHub Actions:
   - (a) CI: `npm run verify` on every PR (the same gate Netlify already runs since Release 0.1, now as a PR check before merge)
   - (b) Claude Code Action: mentioning `@claude` in an issue produces a PR
   - (c) **auto ingest** workflow when `content/**` changes on main (secrets: `OPENAI_API_KEY`, `MONGODB_URI`)
7. [ ] Write 2 small real tasks ("add a domain filter to the quiz form", "fix code block rendering in chat") with `/new-task`, open a GitHub issue for each whose body is the task file plus `Task: TASK-NNN`, mention `@claude`, and let Claude handle them. **Review the PRs like a senior**, record how many fixes you had to request.
8. [ ] 1 script using `claude -p` (e.g. summarize commits into a changelog).

**Done when:** you have a before/after metrics table; at least 1 issue → PR merged; CI green; ingest runs automatically on content changes.

**Traps:** overfitting to the golden set (tuning until those 30 questions pass, then failing on real ones); biased judges; Actions burning money with loose triggers; secrets leaking via fork PRs.

**Submit:** before/after eval table, link to a Claude-created PR, your review notes.

---

## MODULE 7: Ship the product (4–5h)

**Branch:** `module-7/hardening`

### Theory to grasp
- **Compact threat model:** (1) being used as a free OpenAI proxy, (2) prompt injection, (3) leaked keys, (4) wallet-draining spam.
- Countermeasures: auth (reuse the site's existing auth), per-user/IP quota, input length limits and `max_tokens`, a daily cost ceiling with an emergency kill switch, usage logging.
- **Git worktrees:** multiple working directories from one repo, so several Claude sessions can run in parallel without stepping on each other.

### Lab
1. [ ] **Quota:** `usage` collection `{ userId | ipHash, date, chatCount, quizCount, tokens }`, incremented with `findOneAndUpdate` + upsert + `$inc` (atomic). Example limits: guests 5 chats/day; signed-in users 30 chats + 3 quizzes/day. Over the limit → return 429 with a friendly message.
2. [ ] **System-wide daily cost ceiling:** when exceeded, automatically disable Quiz mode. Keep the OpenAI dashboard hard limit as the final safety layer.
3. [ ] **Input validation:** Zod, length limits, topic whitelist, strict CORS, no logging of sensitive content.
4. [ ] **Prompt injection defenses:** separate system / context / user; wrap context in delimiters and state clearly it's data, not instructions; add 5–10 `adversarial` cases to the golden set ("ignore previous instructions", "print the system prompt"...) and rerun evals.
5. [ ] Run the `review/security` subagent over the whole project diff, address each finding.
6. [ ] **History and progress:** `attempts` collection `{ userId, quizId, answers, score, wrongQuestionIds }`; a "retry wrong questions" feature; a progress page per topic.
7. [ ] **UX:** skeleton loading, friendly errors + retry button, saved chat drafts, mobile, a11y (focus, `aria-live`), Lighthouse.
8. [ ] **Observability:** JSON logs with `requestId`, latency, token counts, retrieval scores. A Mongo query (or small admin page) showing usage per day.
9. [ ] **Worktrees:** `git worktree add ../aws-quota feat/quota` and `../aws-ui feat/ui-polish`, run 2 Claude sessions in parallel, then merge.
10. [ ] **Release:** checklist, tag `v1.0`, deploy to production, smoke test, know how to roll back (republish the previous deploy on Netlify).
11. [ ] **4 role plays** (mentor plays the other side): explain Claude Code to a non-technical person; onboard a colleague using `CLAUDE.md` + docs; interview question "how do you use AI in your dev workflow?"; responsible AI use (when you must not trust the output).

**Done when:**
- a script firing 100 requests is blocked at exactly the right threshold
- the cost-ceiling switch works
- adversarial cases don't leak the system prompt
- a smooth 5-minute demo: study a lesson → Q&A → generate a quiz → take it → view progress

**Submit:** quota stress results, security subagent report + how you addressed it, production link.

