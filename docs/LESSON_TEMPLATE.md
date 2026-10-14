# Lesson template

Every lesson in `content/<topic>/` follows this shape. Lessons are both read on the site and ingested for Q&A and quizzes
(see [architecture.md](architecture.md)), so the structure matters for retrieval quality, not just looks.

## Writing rules (why the shape matters)

- **Frontmatter is required.** It defines the lesson title, topic, order, and stable URL slug. SAA-C03 module lessons also declare their module.
- **One idea per `##` section.** Chunks are split by heading, so each section must make sense on its own,
  without "as mentioned above". Aim for roughly 300–800 tokens per section.
- **Keep code blocks whole and short.** A chunk never cuts through a code block, so a giant block makes a giant chunk.
- **Use descriptive headings.** They become the chunk's `headingPath` and show up in citations.
- **Canonical source:** Markdown (`.md`). If an HTML export shares the same base name, the site publishes the Markdown file once; avoid maintaining two editable versions.
- **File name:** `<number>-<short-slug>.md`, e.g. `content/aws-saa-c03/Module 1/01-iam-foundations.md`.

## Template

Copy everything below into a new file.

```md
---
title: <Lesson Title>
topic: aws-saa-c03            # aws-saa-c03 | context-engineering | reactjs | agentic-ai-code
order: 1
slug: iam-foundations        # stable lesson URL
module: 1                    # SAA-C03 module number; omit for ungrouped topics
moduleTitle: Identity and Access Management
date: 2026-10-02
tags: [IAM]
domain: Design Secure Architectures   # optional, SAA-C03 domain for quiz tagging
---

# <Lesson Title>

## Concept
2-4 sentences explaining the core idea. What is it, why does it exist.

## <Building Blocks / Best Practices / whatever fits the topic>
A short list or comparison table of the key pieces.

| Item | What it does |
| ---- | ------------ |
| TODO | TODO         |

## Real Project Example
One concrete, realistic scenario showing the concept in use.

## Funny Analogy (optional)
A short story-style analogy (e.g. "CloudFactory Inc.", Pho24h — pick a running theme per topic).

> **Pro tip:** one closing, high-signal takeaway.
```
