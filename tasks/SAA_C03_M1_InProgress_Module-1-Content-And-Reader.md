---
id: SAA_C03_M1
type: feature
topic: aws-saa-c03
module: 1
created: 2026-10-06
---

# SAA-C03 Module 1: Content and reader

## Goal
Publish Module 1 as an organized set of SAA-C03 lessons with a calm, minimal reading experience and clear GitHub-inspired code blocks.

## Context
The current content catalog flattens all Markdown and HTML files into topic lessons. Module folders and paired HTML/Markdown files are not represented as a hierarchy, and the lesson page contains generic non-course UI. Current Module 1 source in this checkout is `content/aws-saa-c03/01-iam-intro.md`; there is no `Module 1` source folder or HTML companion in the repository.

## Scope
- In: establish explicit Module 1 metadata and source-of-truth conventions; make the SAA-C03 topic page show module groupings without duplicate HTML/Markdown entries; present the existing IAM Foundations material as Module 1; refine lesson reading layout and code styling toward a restrained GitHub-like reading surface; document how to add future module lessons.
- Out: authoring missing AWS course material, converting HTML companions, reorganizing Modules 2–7, quizzes, progress persistence, or changing other topics' content.

## Acceptance criteria
- [ ] Module 1 appears as a named group under the AWS SAA-C03 topic and contains its lesson links in explicit order.
- [ ] The existing IAM Foundations lesson is addressable with a stable, readable slug and shows Module 1 context.
- [ ] SAA-C03 `.md`/`.html` companions do not become duplicate visible lessons.
- [ ] The lesson view is focused on reading, with a clear hierarchy, restrained color, responsive navigation, and legible GitHub-inspired code blocks.
- [ ] Existing non-SAA topics and unassigned SAA-C03 lessons remain discoverable.
- [ ] The content and task documentation explain the canonical file format and metadata for adding Module 1 lessons.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Open `/aws-saa-c03` | Module 1 is clearly grouped and its lesson is listed once | manual |
| 2 | Open the IAM Foundations link | Lesson renders with Module 1 context and reading layout | manual |
| 3 | Load catalog with same-basename `.md` and `.html` fixtures | One canonical lesson is listed | unit |
| 4 | Open existing non-SAA topic | Its lessons remain listed as before | component |
| 5 | Resize lesson view to mobile width | Navigation and content remain readable | manual |

## Notes
- Source material available in this checkout is a short IAM overview. Expand or replace it only with user-provided Module 1 source material.
- Keep Markdown as the single published source when an HTML file is only an export/preview of that same lesson.
