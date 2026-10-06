---
title: Verification loops
topic: agentic-ai-code
order: 3
---

# Verification loops

## Why it matters
Every code change should be checked against a real signal. A verification loop keeps quality high and prevents speculative fixes.

## Core habit
- Make one small change.
- Run a focused validation.
- Read the output carefully.
- Adjust only if the result proves the hypothesis.

## Real project example
A UI bug is fixed by updating the component state shape, then a narrow test and a fast build confirm the route still works. The verification loop stops the change from being “done” before the evidence exists.

> **Pro tip:** verify before claiming success, even for tiny edits.
