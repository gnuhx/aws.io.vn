# TASK-08 — Three Study Modes (AWS / MCP / React) + Header Menu

**Status: In progress**

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

## Pending
- No real MCP or React lesson content written yet — both tracks are placeholder-only,
  same status as TASK-04 (Lambda topic).
- Not manually verified in a browser (no browser-automation tool available in this session) —
  only verified via typecheck + production build succeeding.
