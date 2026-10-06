---
title: Retrieval patterns
topic: context-engineering
order: 2
---

# Retrieval patterns

## Why it matters
The best AI workflows retrieve only what the model needs right now. Strong retrieval patterns avoid overload and improve reasoning quality.

## Common approaches
- Search for a symbol, then read a narrow range.
- Fetch a specific spec or doc section instead of the whole file.
- Pull files in dependency order when you need to understand a bug.
- Prefer structured examples over long narrative dumps.

## Real project example
Before changing a route, a developer retrieves the router file and only the affected page component. This keeps the context small, accurate, and easy to reason about.

> **Pro tip:** a good retrieval pattern reduces noise, not just token count.
