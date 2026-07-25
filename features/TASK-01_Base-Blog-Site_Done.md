# TASK-01 — Base Blog Site (Medium-style AWS learning blog)

**Status: Done**

Source doc: [docs/project-spec.md](../docs/project-spec.md)

## Scope
React + TypeScript + Vite + React Router frontend-only blog. Homepage listing
posts, post detail page, 404 page, no backend/auth/DB/CSS framework.

## Evidence
- `src/pages/HomePage.tsx`, `src/pages/PostDetailPage.tsx`, `src/pages/NotFoundPage.tsx`,
  `src/components/Header.tsx` all exist and are wired into `src/App.tsx`.
- `src/data/posts.ts` holds post content as local mock data (no backend), matching the spec.
- Stack matches: React, TypeScript, Vite, React Router, plain CSS (no Tailwind/UI library
  at this layer — Tailwind was added later only for the learning-tree/VPC sub-features).

## Notes
- The spec doc itself (`docs/project-spec.md`) is cut off mid-section ("### 5.1 Home Page")
  and never finished — the implementation exists but the written spec was abandoned partway.
