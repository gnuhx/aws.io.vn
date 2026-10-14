---
id: TASK-017
type: feature
module: none
decisions: []
created: 2026-10-12
---

# TASK-017: Responsive fixes for phone, iPad and desktop Chrome

## Goal
Reading and tracking progress feels native on a phone and an iPad: content first, no iOS zoom on form fields, tap targets big enough for fingers, nothing floating over the text, and details that were hover-only also work by tap.

## Context
Audit of all `*.module.css` on 2026-10-12 at ~375px (phone), 768–1024px (iPad) and desktop Chrome. Nothing is broken (viewport meta present, tables/code scroll, grids auto-fit); the issues are touch comfort and wasted space. Files: `pages/Lesson/LessonPage.*`, `pages/Roadmap/RoadmapProgressView.module.css`, `pages/Roadmap/ProgressDonut.tsx`, `pages/Roadmap/LearningCalendar.tsx`, `components/TestNowBubble/*`, `components/Toast/Toast.module.css`, `components/TagInput/TagInput.module.css`, `layouts/SiteLayout.module.css`, `styles/global.css`.

## Scope
- In (#1 + #9): lesson page goes single-column at ≤ 1024px (was 800px, so iPad Air/Pro portrait got a ~460px article). In single-column mode the module's lesson list is a collapsed "Lessons in this module (N)" disclosure, so the article comes first.
- In (#2): on touch devices (`pointer: coarse`) every text input, select and textarea is at least 16px, so iOS Safari doesn't zoom on focus.
- In (#3): on touch devices, roadmap status selects, filter chips and the lessons select, tag remove buttons, toast close button and header buttons get ≥ 40px (≥ 32px for inline tag "×") hit areas.
- In (#4): at ≤ 700px the "Test now" bubble stays in the bottom-right corner (no random travel over the text); toasts show at the top on phones so the two never overlap.
- In (#5): at ≤ 640px the sticky roadmap filter bar keeps the status chips on one horizontally scrollable row, so it stays two rows high.
- In (#6): donut legend rows and calendar days also respond to tap / keyboard focus, not only mouse hover.
- In (#12, #13): viewport-height units use `dvh` (fallback `vh`) so iPad/iPhone toolbars don't make sticky panels jump; the interactive lesson iframe fits short laptop screens (min-height 600px → 420px, height accounts for both headers).
- Out (follow-ups): hiding the site header on lesson pages (#8, it holds sign-in / avatar); unifying the 7 breakpoint values into three; a Playwright screenshot/overflow check at 375/820/1024/1440 (needs a new dev dependency); `env(safe-area-inset-*)` (only non-zero with `viewport-fit=cover`, which we don't set).
- Already fine: the learning calendar starts scrolled to the latest week.

## Acceptance criteria
- [x] Given a viewport ≤ 1024px, when a lesson opens, then the article is the first content after the header, and the module lessons are inside a closed disclosure that opens on tap.
- [x] Given a viewport > 1024px, then the lesson sidebar is the sticky list as before.
- [ ] Given a touch device, when a roadmap status select / filter / settings field is focused, then its font size is ≥ 16px (no zoom) and its hit area is ≥ 40px tall.
- [ ] Given a phone (≤ 700px) on the AWS course page, then the "Test now" bubble stays in the bottom-right corner, and toasts appear at the top.
- [x] Given a donut legend row or calendar day, when tapped or focused, then its detail shows as it does on hover.
- [ ] No page scrolls horizontally at 375px.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Lesson page with `matchMedia('(max-width: 1024px)')` true | Lesson list inside a closed `<details>`; summary "Lessons in this module (N)" | component |
| 2 | Same with the query false | Plain sidebar nav, no `<details>` | component |
| 3 | Click a calendar day | Caption shows that day's date and count | component |
| 4 | Chrome DevTools device toolbar: iPhone 12, iPad Air portrait/landscape, 1440px desktop | Criteria above hold; no horizontal scroll | manual |
| 5 | Real iPhone Safari: tap a roadmap status select | No zoom | manual |

## Notes
- The 16px rule uses `!important` inside `@media (pointer: coarse)`: CSS-module class selectors (e.g. `.statusSelect`) are more specific than element selectors, and this rule must win everywhere on touch devices.
- Found while checking screenshots (pre-existing, also on desktop), fixed here: on `/:topic/roadmap` the "Sign in to track progress" / "Continue learning →" buttons had blue text on blue (`CourseRoadmapPage .article a` beat `.signInLink`), and `.article:has(.progressView)` never matched across CSS modules, so the roadmap sat in two nested cards. Now `.summary a.signInLink` and a `data-progress-view` attribute.
- Verified with headless Chrome screenshots at 390×844 (lesson, course, roadmap), 820×1180 (lesson) and 1440×900 (lesson). Touch-only rules (`pointer: coarse`) and iOS zoom still need a real phone / DevTools touch emulation.
