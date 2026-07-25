# Lesson content template

This is the structure every lesson on this site follows (established by the IAM lessons in
`docs/stupid-dev-learns-aws/IAM/`). Write a lesson in this shape, then either:
- hand me the filled-in `.md` and I'll transcribe it into `src/data/posts.ts`, or
- paste HTML directly into a post's `content` field yourself using the skeleton below.

## Markdown shape (for writing/reviewing content)

```md
# <Lesson Title>

---

## Concept
2-4 sentences explaining the core idea. What is it, why does it exist.

## <Building Blocks / Best Practices / whatever fits the topic>
A short list or comparison table of the key pieces.

## Real Project Example
One concrete, realistic scenario showing the concept in use.

## Funny Analogy (optional)
A short story-style analogy, same house style as the IAM lessons
(e.g. "CloudFactory Inc.", Pho24h, etc. — pick a running theme per topic if you want one).

> **Pro tip:** one closing, high-signal takeaway.
```

## HTML skeleton (goes in `posts.ts` → `content`)

Reuses existing site CSS classes — no new styles needed.

```html
`
  <h2>Concept</h2>
  <p>
    TODO: core idea, 2-4 sentences.
  </p>

  <h2>TODO: Building Blocks / Best Practices</h2>
  <ul>
    <li><strong>TODO</strong> — point one.</li>
    <li><strong>TODO</strong> — point two.</li>
  </ul>

  <!-- optional comparison table -->
  <table class="lesson-table">
    <thead>
      <tr><th>TODO col</th><th>TODO col</th></tr>
    </thead>
    <tbody>
      <tr><td>TODO</td><td>TODO</td></tr>
    </tbody>
  </table>

  <h2>Real Project Example</h2>
  <p>TODO: one concrete scenario.</p>

  <h2>Funny Analogy</h2>
  <p>TODO: short story setup.</p>

  <!-- optional visual — 2-4 columns connected by arrows -->
  <div class="story-chart" aria-label="TODO diagram label">
    <div class="story-chart__column">
      <div class="story-chart__box story-chart__box--danger">TODO</div>
      <div class="story-chart__label">TODO</div>
    </div>
    <div class="story-chart__arrow">→</div>
    <div class="story-chart__column">
      <div class="story-chart__box story-chart__box--safe">TODO</div>
      <div class="story-chart__label">TODO</div>
    </div>
  </div>

  <blockquote class="lesson-tip">
    <p><strong>Pro tip:</strong> TODO closing takeaway.</p>
  </blockquote>
\`,
```

## Post entry shape (in `src/data/posts.ts`)

```ts
{
  id: 'mcp-lesson-1',        // must match the postId in learningTrees.ts
  title: 'TODO Lesson Title',
  excerpt: 'TODO one-sentence summary for cards/previews.',
  date: '2026-07-25',
  readTime: 8,                // minutes
  tags: ['MCP', 'Roadmap'],    // or ['React', 'Roadmap']
  content: `...HTML skeleton above...`,
  isListed: false,             // keep false — lessons aren't listed on the homepage
},
```

## Where each mode's lesson slots currently live

- MCP: `mcp-lesson-1`, `mcp-lesson-2` in `src/data/posts.ts` (currently placeholder)
  and `src/data/learningTrees.ts` under the `study-mcp` tree.
- React: `react-lesson-1`, `react-lesson-2` in `src/data/posts.ts` (currently placeholder)
  and `src/data/learningTrees.ts` under the `study-react` tree.

Once you send real content for a lesson, I'll also update its `title`/`summary` in
`learningTrees.ts` to match, and can add a quiz for it in `src/data/quizzes.ts`
(see `iam-secure-root-account` in that file for the quiz shape).
