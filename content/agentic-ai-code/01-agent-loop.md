---
title: Agent loop
topic: agentic-ai-code
order: 1
---

# Agent loop

## Why it matters
Helpful agents follow a loop: read the issue, inspect the relevant files, propose a plan, make limited changes, and verify the result.

## Good loop
- Gather just enough context.
- State the plan before editing.
- Change one thing at a time.
- Run the smallest validation available.

## Real project example
A coding assistant checks the router, then updates a single page component, and runs a narrow test set before concluding the task is complete.

> **Pro tip:** the best agents reduce uncertainty before they edit code.
