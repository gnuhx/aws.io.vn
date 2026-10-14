---
title: Component composition
topic: reactjs
order: 2
---

# Component composition

## Why it matters
Good React interfaces are built from small, focused components that each handle one concern. Composition makes UI systems easier to scale and reason about.

## Composition patterns
- Split page layout into reusable sections.
- Pass data down through props.
- Keep presentational components separate from logic.
- Reuse simple building blocks across screens.

## Real project example
A lesson page can be composed from a header, sidebar, lesson body, and progress summary. Each part is responsible for a single part of the experience, which makes it easier to adapt the layout.

> **Pro tip:** prefer composition over giant components with too many responsibilities.
