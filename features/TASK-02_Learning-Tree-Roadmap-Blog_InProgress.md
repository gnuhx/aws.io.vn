# TASK-02 — "Learning Tree Blog" Roadmap/Skill-Tree Feature

**Status: In progress (partial)**

Source doc: [docs/stupid-dev-learns-aws/stupid-dev-learns-aws.md](../docs/stupid-dev-learns-aws/stupid-dev-learns-aws.md)

## Scope
An interactive roadmap/skill-tree visualization (Git-graph / roadmap.sh style) for
browsing topics → lessons, built with React Flow, Tailwind, Framer Motion, with
zoom/pan, minimap, animated edges, expand/collapse, and localStorage progress tracking.

## Done
- `src/components/LearningTree/LearningTreeView.tsx` + `LessonPickerModal.tsx` render
  topics/lessons from `src/data/learningTrees.ts`.
- Lesson completion tracking via `localStorage` (`learning-tree:<id>:completed`).
- Per-lesson quiz system (`src/components/LessonQuiz/LessonQuiz.tsx`) reading from
  `src/data/quizzes.ts`.
- Framer Motion used for animation (`motion`, `AnimatePresence`).
- Route wired at `/` and `/learning/:id` in `src/App.tsx`.

## Pending / gap vs. spec
- **React Flow is not actually used.** `@xyflow/react` is a declared dependency in
  `package.json` but is not imported anywhere in `src/` (confirmed via repo-wide grep).
  The current UI is a custom list/card layout, not a pannable/zoomable Git-graph canvas.
- No minimap, no zoom/pan canvas, no animated-edge graph as described in the spec.
- "Dark developer-style UI" and GitHub-graph/RPG-skill-tree visual feel not implemented —
  current UI is a light card list matching the rest of the site.

## Recommendation
Either implement the React Flow canvas to match the original spec, or update the spec
doc to reflect the simpler list-based design that was actually shipped.
