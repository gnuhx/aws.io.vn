---
title: State and effects
topic: reactjs
order: 3
---

# State and effects

## Why it matters
State drives reactivity, while effects handle actions that happen after render, like data fetching or subscriptions. React apps become reliable when these responsibilities are kept separate.

## Core ideas
- State represents current values in the UI.
- Effects run after render and can synchronize side effects.
- Dependency arrays control when effects rerun.
- Derived values often belong in render logic, not in state.

## Real project example
A lesson browser stores the selected topic and the current lesson, then uses derived data to render a progress summary. The component does not need to duplicate state for every computed value.

> **Pro tip:** treat effects as a synchronization tool, not as a substitute for thoughtful state design.
