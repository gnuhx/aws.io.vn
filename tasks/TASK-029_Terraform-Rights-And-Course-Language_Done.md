---
id: TASK-029
type: chore
module: none
decisions: [D-011]
created: 2026-10-22
---

# TASK-029: Terraform course rights and language

## Goal
Confirm the Terraform content can be published publicly, and in which language, before engineering effort goes into releasing it.

## Context
The text reads as a published book: it refers to itself by chapter ("As we discussed in Chapter 4") and uses the FleetPortal / FleetAPI sample app, which appears to come from Packt's *Mastering Terraform*. The other courses on the site are original or adapted material.

## Scope
- In: Decide one of: (a) we have rights to republish as-is, (b) rewrite/summarize into original lessons (like the SAA-C03 notes), (c) keep private / do not release. Decide the course language (English as uploaded, or Vietnamese).
- Out: Doing the rewrite itself (becomes its own per-chapter tasks if (b) is chosen).

## Acceptance criteria
- [x] The decision is recorded in `docs/decisions.md` with the reasoning.
- [ ] If (b): one rewrite task per chapter group is created and TASK-033 depends on them.
- [ ] If (c): TASK-030 to TASK-033 are marked `Dropped`.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Review decision entry | Rights basis and language are stated | manual |

## Notes
- 2026-10-22: Source confirmed: the public GitHub repo for Packt's *Mastering Terraform* (`~/Downloads/Mastering-Terraform-main`), which ships an **MIT License** ("Copyright (c) 2024 Packt") covering the repo contents. MIT permits publishing and modifying as long as the copyright and permission notice is kept. The notice is copied to `content/terraform/LICENSE`; the released course should also show an attribution line (e.g. on the topic page) linking the book and the license. The remaining decision is mainly language (English as-is vs Vietnamese).

**Blocks TASK-033 (release).** TASK-030 to TASK-032 can proceed meanwhile because the loader and cleanup work is needed whatever the decision is.
