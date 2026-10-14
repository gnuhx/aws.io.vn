---
id: TASK-003
type: feature
module: none             # Release 0.1 (walking skeleton)
decisions: [D-005]
created: 2026-10-02
---

# TASK-003: Lesson pages

## Goal
Render lessons from `content/` as pages on the site, so the deployed skeleton shows real material and Module 1 has a real codebase to map.

## Context
docs/LESSON_TEMPLATE.md (frontmatter + structure), D-005. Depends on TASK-001, TASK-002.

## Scope
- In: build-time loading of `content/**/*.md`; frontmatter schema in `src/shared/schemas/lesson.ts` (Zod: `title`, `topic` ∈ the 4 topics, `order`, `date`, `tags`, optional `domain`); routes `/` (topic list), `/:topic` (lessons sorted by `order`), `/:topic/:slug` (lesson rendered with react-markdown); a not-found page; a content validation test that checks every lesson file against the schema
- Out: `.html` lessons (later); search; styling beyond readable defaults; the chat widget (Module 2)

## Acceptance criteria
- [ ] Given `content/aws-saa-c03/01-iam-intro.md` with valid frontmatter, when I open `/aws-saa-c03/01-iam-intro`, then its title and `##` sections render
- [x] Given 3 lessons with `order` 2, 1, 3, when I open the topic page, then they're listed in order 1, 2, 3
- [x] Given an unknown topic or slug, when I open its URL, then the not-found page shows (not a blank page)
- [x] Given a lesson with missing `title` or an unknown `topic`, when I run `npm run verify`, then it fails and names the file and field
- [x] Given a topic with no lessons, when I open the topic page, then an empty state shows

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | loader: fixture md with frontmatter | `{ topic, slug, title, order, body }` parsed | unit |
| 2 | loader: 3 fixtures with order 2, 1, 3 | sorted 1, 2, 3 | unit |
| 3 | schema: missing `title` | Zod error mentions `title` | unit |
| 4 | schema: `topic: "aws"` | Zod error mentions `topic` | unit |
| 5 | content validation over real `content/**/*.md` | all files pass | unit |
| 6 | render lesson page with fixture | title + headings in document | component |
| 7 | render `/nope` and `/nope/nope` | not-found text shown | component |
| 8 | open one real lesson on the dev server | renders | manual |
| 9 | render topic page for a topic with no lessons | empty-state text shown | component |

## Notes
- D-005 accepted 2026-10-03. Still waits on TASK-001 and TASK-002.
- Needs one real lesson in `content/` **written by you**. Claude doesn't write lesson content.
- Gotcha: `gray-matter` needs Node's `Buffer` and breaks in the browser. Parse frontmatter at build time (Vite `import.meta.glob` with `?raw` + a small YAML parser such as `yaml`, or a tiny Vite plugin) and keep the browser bundle free of Node APIs. Module 4's ingest can still use gray-matter, since it runs in Node.
