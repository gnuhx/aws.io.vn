---
id: SAA_C03_M2
type: feature
topic: aws-saa-c03
module: 2
created: 2026-10-08
---

# SAA-C03 Module 2: Interactive sections

## Goal
Publish the available Module 2 section materials in the course reader while preserving the existing HTML lessons' visual design and interactions.

## Context
The roadmap lists Module 2 as Compute and Identity Foundations. Three section documents are available for EC2 Core and Networking, EC2 Lifecycle and Pricing, and Elastic Load Balancing and Auto Scaling. Each has a Markdown companion and a standalone HTML version with inline tab, quiz, lab, and navigation logic.

## Scope
- In: group the three available sections under Module 2; keep their Markdown metadata in the catalog; serve the paired HTML as separate interactive assets; exclude the authoring prompt and roadmap from learner lessons; keep uncurated Modules 3–7 out of the published course list for now.
- Out: author missing IAM or Organizations sections; reorganize Modules 3–7; alter the existing Module 2 HTML content or interactions; rewrite the standalone HTML design.

## Acceptance criteria
- [ ] The SAA-C03 course page shows Module 2 with the three available sections in roadmap order.
- [ ] Each section opens its original HTML experience with its styling, tabs, quizzes, lab content, and in-page navigation intact.
- [ ] The Markdown/HTML pairs produce one catalog entry per section.
- [ ] `prompt_template.md` and `roadmap.md` do not appear as learner lessons.
- [ ] Module 1 and other topics remain available; uncurated Module 3–7 materials do not appear as course modules yet.
- [ ] Production output contains the three HTML files as separate assets instead of embedding their source in the main JavaScript bundle.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Open `/aws-saa-c03` | Module 2 shows three sections in order | manual |
| 2 | Open each Module 2 section | Original standalone HTML UI and interactions render | manual |
| 3 | Build for production | Three HTML assets are emitted and referenced by the app | build |
| 4 | Open Module 1 and a non-SAA topic | Existing content remains available | manual |

## Notes
- The roadmap also includes IAM and AWS Organizations sections, but full section materials for them are not present in the current Module 2 folder. Do not invent lessons to fill those gaps.
- The HTML pages load Google Fonts from the network and use no external JavaScript dependencies.
