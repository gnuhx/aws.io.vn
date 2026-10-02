# Decisions

Why things are the way they are. Newest first.

- **Status:** Proposed → Accepted | Rejected | Superseded by D-xxx
- Never delete an entry. To reverse a decision, add a new one that says `Supersedes D-xxx`.
- Keep rejected ideas: "why didn't we do X?" is the question you'll ask most.
- A decision is never coded directly. Once accepted, create task files in [tasks/](../tasks/) and list their IDs under **Tasks**.

Template:

```md
## D-xxx · YYYY-MM-DD · Proposed
**Question:** What needs deciding?
**Options:** (a) ...; (b) ...
**Decision:** _open_ | which option, and the evidence for it
**Consequences:** what this changes (docs, schema, roadmap steps)
**Tasks:** TASK-012, TASK-013 | —
```

---

## D-003 · 2026-10-02 · Proposed
**Question:** Repo shape: single folder, or separate `client/` + `server/`?
**Options:** (a) single folder with `src/` + `netlify/functions/`; (b) `client/` + `server/`; (c) monorepo with workspaces
**Decision:** _open_ (settle before Module 1)
**Consequences:** fixes paths in [architecture.md](architecture.md), `CLAUDE.md`, and permission rules in Module 3
**Tasks:** —

## D-002 · 2026-10-02 · Proposed
**Question:** Does the site have login/users?
**Options:** (a) reuse existing auth; (b) add auth; (c) guests only, quota by IP hash
**Decision:** _open_ (settle before Module 1)
**Consequences:** decides how quota and attempt history work in Module 7
**Tasks:** —

## D-001 · 2026-10-02 · Proposed
**Question:** Is MongoDB Atlas or self-hosted?
**Options:** (a) Atlas (free M0 tier); (b) self-hosted
**Decision:** _open_ (settle before Module 1)
**Consequences:** if not Atlas, the `$vectorSearch` approach in Module 5 must change
**Tasks:** —
