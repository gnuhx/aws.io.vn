# TASK-09 — Import AI Agent Course Content into Study MCP

**Status: Done**

Source: [docs/study-mcp/roadmap - AI Agent Context.md](../docs/study-mcp/roadmap%20-%20AI%20Agent%20Context.md)
(user's personal study checklist) + 23 pre-built HTML lesson exports the user dropped into
`docs/study-mcp/content/` (LangChain, RAG, LangGraph, MCP, and one applied project).

## Problem
The user's course export files are complete, self-contained HTML documents — each with its
own `<style>` and `<script>` (dark theme, tabbed sections). The site's existing lesson model
(`postId` → HTML fragment injected via `dangerouslySetInnerHTML` into the site's own page
chrome) can't safely hold these: injected `<style>` tags would leak global CSS into the rest
of the site, and injected `<script>` tags never execute via `innerHTML`, so the lessons'
tab interactivity would break.

## Solution
- Copied all 23 files as-is into `public/study-mcp/lessons/*.html` (cleaned filenames: no
  spaces/parens/underscores) — Vite serves `public/` at the site root, so each lesson is a
  fully isolated static page with its styling and JS intact.
- Extended the data model: `LearningTreeLesson.postId` is now optional, and a new
  `externalUrl?: string` field can point at one of these static pages
  (`src/types/learningTree.ts`).
- `LearningTreeView.tsx`: when a lesson has `externalUrl`, selecting it auto-opens a **fullscreen
  overlay** (`position: fixed; inset: 0`, above the header) with the lesson's `<iframe>` filling
  the entire viewport and a slim top bar (← Back to roadmap / lesson title / Open in new tab ↗).
  Escape or the back button returns to the roadmap+article view, where a "View fullscreen ⛶"
  button reopens it. (First pass embedded the iframe inline in the ~65%-width article column —
  too small/cramped, replaced with this fullscreen overlay per user feedback.) The "Mark
  complete" flow (localStorage) works identically for both lesson types since it only depends
  on `lesson.id`.
- Reorganized `study-mcp` in `src/data/learningTrees.ts` into 6 topics matching the course's
  own module numbering: MCP Basics (+ the new Lesson 8.1), LangChain Fundamentals (1.1/1.3/1.4),
  RAG (2.13–2.16, 2.17), LangGraph Core (module overview + 3.1–3.14, 15 lessons), Advanced
  LangGraph Patterns (module 9), and Projects (the exam-generator build).
- Updated the tree's on-page title to "Study MCP & AI Agents 🔌" to be honest that the content
  now spans the whole course, not just MCP — left the compact header tab label as "MCP" since
  MCP is the course's stated destination (see the roadmap doc) and the tab has no room for more.
- Added **Previous / Next** lesson navigation (walks the flattened lesson list across topic
  boundaries), in both the regular article header and the fullscreen bar; buttons disable at
  the first/last lesson. Locked background scroll (`document.body.style.overflow = 'hidden'`)
  while the fullscreen overlay is open. Hid the native scrollbar site-wide (`scrollbar-width:
  none` / `::-webkit-scrollbar { display: none }` in `src/index.css`) per user request —
  scrolling still works, the bar itself is just not drawn.

## Verified
- `tsc --noEmit` and `vite build` both clean.
- `dist/study-mcp/lessons/` contains all 23 copied HTML files after build.
- Served the production build and confirmed a sample lesson
  (`/study-mcp/lessons/lesson-8.1-intro-to-mcp.html`) returns HTTP 200 with its own `<title>`
  intact, and `/learning/study-mcp` loads.
- Confirmed new topic/lesson ids (`lg-3-1`, `lg-module-3`, `proj-exam-generator-v2`,
  `langgraph-advanced`, the `study-mcp/lessons` URL prefix) are present in the built JS bundle.
- No true interactive/visual browser check — no browser-automation tool in this environment.

## Notes
- `docs/study-mcp/content/*.html` are kept as the source copies; `public/study-mcp/lessons/*.html`
  are the served copies. If a lesson file is ever edited, both need updating (or repoint one
  as the single source and re-copy).
- The roadmap file's own checklist (Lesson 8.2, 8.7–8.9, Course 4 10.3–10.4, Course 2 4.4,
  and the Deep Agents module 11.1/11.2) is NOT yet covered by any of the 23 files provided —
  those are still to come from the user.
