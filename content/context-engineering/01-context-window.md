---
title: Context Window Basics
topic: context-engineering
order: 1
---

# Context Window Basics

## Why it matters
The context window is the amount of prompt and retrieved material an AI can reason over at once. Good workflows respect that limit and place only relevant information into the model.

## Good habits
- Keep instructions short and explicit.
- Use project docs for background context.
- Prefer targeted retrieval over dumping all files.

## Real project example
Instead of pasting the entire codebase, a teammate asks for the exact authentication handler and only references the file that deals with login.

> **Pro tip:** small, specific context usually produces higher-quality output than huge but noisy input.
