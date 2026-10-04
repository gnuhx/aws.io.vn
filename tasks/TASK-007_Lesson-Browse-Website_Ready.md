---
id: TASK-007
type: feature
module: none
created: 2026-10-04
---

# TASK-007: Lesson browse website

## Goal
Build a website shell that browses topics and lessons from the project content folders so learners can navigate real course material from the home page.

## Context
The repo already has the project structure and roadmap expectations for a lesson catalog. This feature turns that structure into a usable site experience without introducing the chat or quiz features yet.

## Scope
- In: a topic landing page, topic detail page, lesson detail page, content discovery from `content/`, empty-state handling, and simple navigation between lessons
- Out: full AI chat, auth, progress backend, and advanced quiz generation

## Acceptance criteria
- [ ] Given the `content/` folder contains topic folders, when the site loads, then the home page shows the available topics
- [ ] Given a topic has lessons, when I open that topic page, then the lessons are shown in order
- [ ] Given a lesson file exists, when I click or open the lesson route, then the lesson title and content render
- [ ] Given no lessons exist, when the page loads, then an empty-state message explains the situation
- [ ] Given an invalid lesson or unknown route, when the user navigates there, then the app shows a friendly fallback instead of a blank page

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | render home page | topic cards appear | component |
| 2 | loader with ordered lesson files | lessons sorted correctly | unit |
| 3 | missing lesson content | empty-state appears | component |
| 4 | lesson route with unknown slug | not-found fallback shows | component |

## Notes
- Content remains the source of truth; do not hardcode route behavior beyond the expected topic IDs.
- The initial implementation should support the existing content folders and a graceful empty-state if they are not populated yet.
- This feature is intentionally smaller than the Q&A or quiz experience described in the architecture doc.
