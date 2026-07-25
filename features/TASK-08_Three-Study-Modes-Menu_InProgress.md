# TASK-08 — Three Study Modes (AWS / MCP / React) + Header Menu

**Status: Done (first lesson each; more content to come)**

No docs/ spec — requested directly in conversation on 2026-07-25.

## Scope
Add "Study MCP" and "Study React" as sibling modes to the existing "Study AWS" learning
tree, and add a header tab bar so users can switch between the three.

## Done
- `src/data/learningTrees.ts`: added `study-mcp` (`/learning/study-mcp`) and `study-react`
  (`/learning/study-react`) trees, each with one placeholder topic and 2 placeholder lessons
  — same pattern as the existing Lambda placeholder track.
- `src/data/posts.ts`: added matching placeholder posts (`mcp-lesson-1/2`, `react-lesson-1/2`,
  `isListed: false`) so the lesson panes render instead of going blank.
- `src/components/Header.tsx` + `Header.css`: replaced the static tagline with a 3-tab nav
  (AWS / MCP / React), active tab highlighted via `useLocation` path-prefix matching. AWS tab
  points at `/` (unchanged default route), MCP/React point at their new `/learning/...` routes.
- `tsc --noEmit` and `vite build` both pass clean.
- Verified (2026-07-25): production build's bundled JS contains the new mode data
  (`study-mcp`, `study-react`, `Study MCP`, `Study React`, `header-mode` class); served the
  `dist` output with `vite preview` and confirmed `/`, `/learning/study-mcp`,
  `/learning/study-react`, and `/learning/stupid-dev-learns-aws` all return HTTP 200.
- Content template + structure at `docs/LESSON_TEMPLATE.md`, matching the format established
  by the IAM lessons (`lesson-table`, `story-chart`, `lesson-tip` CSS classes).
- Wrote the first real lesson for each new mode, in that template's format:
  - MCP: "What is MCP? The USB-C Port for AI Tools" (`docs/study-mcp/What is MCP.md` →
    `mcp-lesson-1` in `posts.ts`) — Host/Client/Server roles, Tool/Resource/Prompt primitives,
    a real project example, and a USB-C analogy.
  - React: "What is React? Components, JSX, and the Virtual DOM Mental Model"
    (`docs/study-react/What is React.md` → `react-lesson-1` in `posts.ts`) — JSX, components,
    props/state, and a kitchen-notepad analogy for the virtual DOM.
  - Both wired into `learningTrees.ts` (real titles/summaries, no longer "Lesson 1 MCP" etc.)
    and given a 4-question quiz each in `quizzes.ts` (`mcp1-q1..q4`, `react1-q1..q4`), matching
    the schema used by the IAM quizzes (flowchart diagram + wrong-answer explanations per question).
- Re-verified after adding content: `tsc --noEmit` clean, `vite build` clean, and the new
  lesson/quiz content (`mcp1-q1`, `react1-q1`, lesson titles) confirmed present in the bundled
  production JS.

## Pending
- `mcp-lesson-2` and `react-lesson-2` are still placeholder-only ("This lesson is ready for
  your content.") — same status as TASK-04 (Lambda topic). Next lesson in each track still
  needs real content.
- Still no true browser rendering check (no browser-automation tool available in this
  session) — verification is limited to typecheck, production build, bundle content
  inspection, and HTTP-level route checks against the built `dist` output.
