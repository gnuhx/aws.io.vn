---
id: TASK-008
type: feature
topic: aws-saa-c03
created: 2026-10-08
---

# SAA-C03 practice test launcher

## Goal
Make the supplied practice exams discoverable from every SAA-C03 course page and runnable from a test selection page.

## Scope
- Add a fixed “Do Test Now!” bubble across SAA-C03 pages, with 1–7 hover dodges per page visit.
- Add `/aws-saa-c03/tests` with a selectable catalog and embedded exam runner.
- Present exams as a responsive, two-column Trello-style card board with clearly labeled sample activity stats.
- Keep the original exam HTML and its interaction logic intact.
- Use a plain white reading surface in all exam HTML versions, without the original tinted page background and framed panels.
- Leave the `v3_theme2` presentation variant out of the catalog to avoid listing exam 3 twice.

## Acceptance criteria
- [x] The CTA links to the SAA-C03 test selection page, stays fixed above page content, and makes 1–7 randomized hover dodges per page visit.
- [x] Available exams 2–10 are selectable and run their original HTML in an isolated frame.
- [x] Test choices appear as two-column desktop cards with labeled sample attempt counts and yesterday's high score.
- [x] Exam pages use a white background and open layout while preserving question and scoring behavior.
- [ ] Build and typecheck pass.
- [ ] Verify selector and exam interaction in a browser.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Open an SAA-C03 course, lesson, or roadmap page | Floating “Do Test Now!” link is visible | manual |
| 2 | Follow the floating link | `/aws-saa-c03/tests` lists exams 02–10 | manual |
| 3 | Start an exam | Original exam loads and its controls work | manual |
| 4 | Open a non-SAA topic | SAA-C03 CTA is absent | manual |
| 5 | Build for production | Exam HTML assets are emitted and build succeeds | build |
