---
id: TASK-031
type: feature
module: none
decisions: []
created: 2026-10-22
---

# TASK-031: Load Terraform chapters as modules, with images

## Goal
Every Terraform lesson has its own URL, sits in the right chapter in the right order, has a real title and shows its diagrams.

## Context
`src/frontend/content.ts` `parseLessonEntry` only recognizes `Module N/` folders. For `Chapter NN - Title/S. Section/L. Lesson.md` it currently:
- builds the slug from the file name only → collisions (`Overview` ×59, `Section Summary` ×47, `Chapter Summary` ×18, `Chapter Intro` ×17, `Terraform` ×16);
- derives order from a `\b[2-7]\.(\d+)\b` match in the body, so text like "version 1.2.6" changes the order;
- uses the file name as the title ("Overview") because `Terraform` is not in `moduleHtmlTopics`.
`src/frontend/components/Markdown/MarkdownView.tsx` passes image URLs through unchanged, and images under `content/` are not bundled, so `../images/x.png` 404s.
Depends on TASK-030 (clean layout).

## Scope
- In:
  - Recognize `Chapter NN - <Title>` as the module: `order = NN`, `title = <Title>`, `slug = chapter-NN`.
  - Lesson slug `ch<NN>-<section-slug>-<lesson-slug>` (e.g. `ch01-understanding-terraform-state-overview`), unique within the topic.
  - Lesson order `section * 100 + lesson` from the folder/file prefixes, never from body text.
  - Title from the H1 with the `N. ` prefix stripped; generic titles (Overview, Section Summary) shown as `<Section> — Overview` in lists.
  - Optionally show the section name as a sub-heading inside each chapter on the topic page.
  - Exclude `content/terraform/Code Files/**` from the markdown glob.
  - Bundle `content/terraform/**/images/*.png` with `import.meta.glob(..., { query: '?url', import: 'default' })` and add a `urlTransform` (or `img` component) in `MarkdownView` that resolves relative image paths against the lesson's `filePath`.
  - Topic label `Terraform` and an intro line in `getTopicLabel` / `TopicPage.tsx`.
  - Add a unit test asserting every lesson slug in every topic is unique.
- Out: Roadmap and read tracking (TASK-032).

## Acceptance criteria
- [ ] Given the Terraform catalog, then it has 18 modules titled by chapter, in chapter order, and lessons inside each follow folder/file numbering.
- [ ] Given any two lessons in any topic, then their slugs differ (test fails on collision).
- [ ] Given a lesson with diagrams (e.g. Ch01 "Terraform State"), when opened, then every image loads (no 404 in the network tab).
- [ ] Given existing topics (aws-saa-c03, MCP, reactjs), then their slugs, titles and order are unchanged (existing `content.test.ts` passes).
- [ ] `Code Files` READMEs do not appear as lessons.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Parse `terraform/Chapter 01 - Understanding Terraform Architecture/2. Understanding Terraform State/1. Terraform State.md` | module `chapter-1` / "Understanding Terraform Architecture", order 201, title "Terraform State" | unit |
| 2 | Lesson containing "version 1.2.6" | Order from path only | unit |
| 3 | All topics' slugs | Unique per topic | unit |
| 4 | Render markdown with `![x][image-1]` + `[image-1]: ../images/a.png` | `<img src>` is the bundled asset URL | component |
| 5 | Open 3 lessons in different chapters in the dev server | Text, code highlighting and images render | manual |

## Notes
Keep the existing `Module N` path untouched; add the chapter rule as a separate branch in `parseLessonEntry` so other courses can't regress.
