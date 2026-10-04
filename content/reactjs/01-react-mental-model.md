---
title: React mental model
topic: reactjs
order: 1
---

# React mental model

## Why it matters
React treats the UI as a function of state. When data changes, components re-render and the virtual DOM decides what changed.

## Core ideas
- Components are reusable building blocks.
- Props pass data down.
- State represents dynamic values inside a component.
- Effects handle side effects after render.

## Real project example
A list page stores filter state locally, and a rendered list recalculates based on the selected category without a full page reload.

> **Pro tip:** keep state close to the component that owns the behavior.
