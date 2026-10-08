---
id: SAA_C03_M2
type: feature
topic: aws-saa-c03
module: 2
created: 2026-10-08
---

# SAA-C03 course reader: Modules 2–7

## Goal
Apply the Module 2 reader experience across the available SAA-C03 course materials, preserving the supplied HTML interactions and grouping content by module.

## Context
The roadmap defines seven course modules. Modules 2–7 contain mixed Markdown and standalone HTML sources; some HTML files are paired exports, some are unique diagrams, and Module 3 currently contains byte-identical Module 7 copies. The Module 2 implementation is the first integrated set and establishes the reader pattern for the remaining content.

## Scope
- In: show all seven modules using the roadmap and existing overview notes; group available section files by module and lesson order; use full Markdown rendering; serve paired and supplemental HTML as isolated interactive assets; expose the roadmap as a separate page; exclude prompts, outlines, and duplicate Module 7 copies from Module 3.
- Out: author missing IAM, Organizations, or detailed Networking sections; alter the supplied HTML lesson content or interactions; rewrite the standalone HTML design.

## Acceptance criteria
- [ ] The course page groups available materials under Modules 1–7 and preserves section order.
- [ ] Each supplied HTML experience opens with its styles, tabs, quizzes, labs, diagrams, and in-page logic intact.
- [ ] Markdown documents render tables, nested lists, headings, code, and links correctly.
- [ ] The roadmap is reachable as a separate course page; prompts and outlines are not shown as lessons.
- [ ] Module 3 does not show the duplicated Module 7 documents and clearly reflects the limited VPC overview available.
- [ ] Other topics remain available and course documents load as separate assets when opened.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Open `/aws-saa-c03` | Modules 1–7 show their available material in order | manual |
| 2 | Open paired HTML sections from Modules 2, 5, 6, and 7 | Original standalone UI and interactions render | manual |
| 3 | Open a Module 4 or 5 standalone visual | Its own interactive diagram renders | manual |
| 4 | Open a Markdown-only course section | Tables, code blocks, lists, and headings render correctly | manual |
| 5 | Open `/aws-saa-c03/roadmap` | The full numbered roadmap renders as a separate page | manual |
| 6 | Build for production | Markdown and HTML documents are emitted as separate assets | build |
| 7 | Open Module 1 and a non-SAA topic | Existing content remains available | manual |

## Notes
- The roadmap includes IAM and AWS Organizations sections without full source files, and Module 3 has only the short VPC overview. Do not invent lessons to fill these gaps.
- The roadmap identifies Module 1 as Foundation, while the current Module 1 page is labeled Identity and Access Management; flag this for a later content decision.
- Supplied HTML pages load Google Fonts from the network and use no external JavaScript dependencies.
- Scope was expanded from Module 2 to all available modules on 2026-10-08 at the user's request.
