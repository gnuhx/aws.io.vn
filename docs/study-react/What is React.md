# What is React? Components, JSX, and the Virtual DOM Mental Model

---

## Concept

**React** is a JavaScript library for building UIs out of small, reusable pieces called
**components**. Instead of manually finding DOM nodes and mutating them when data changes,
you describe *what the UI should look like for the current state*, and React figures out
the minimal set of real DOM changes needed to get there.

The two ideas that make this work:
- **JSX** — HTML-like syntax inside JavaScript. `<h1>Hello</h1>` compiles down to
  `React.createElement('h1', null, 'Hello')` — it's just a function call in disguise.
- **Virtual DOM** — React keeps a lightweight in-memory tree of what the UI should look
  like, diffs it against the previous tree, and only touches the real DOM where something
  actually changed.

## Building Blocks

| Concept | What it is | Example |
|---|---|---|
| **Component** | A function that returns JSX describing part of the UI | `function Header() { return <h1>Hi</h1> }` |
| **Props** | Read-only inputs passed into a component from its parent | `<Greeting name="Ana" />` |
| **State** | Data a component owns and can change over time | `const [count, setCount] = useState(0)` |
| **Re-render** | React calling your component again after state/props change | Triggered by `setCount(count + 1)` |

## Real Project Example

A `PostCard` component takes a `post` prop (title, excerpt, date) and renders it as a
clickable card — exactly the pattern this site uses in `src/components/PostCard.tsx`. The
`HomePage` component owns the list of posts as data, and hands one `post` prop to each
`PostCard` it renders. Change the underlying data, and only the cards that actually changed
get updated in the real DOM — the rest are left untouched.

## Funny Analogy

Imagine a restaurant where, every time an order changes, the chef doesn't repaint the whole
dining room — they just swap the one plate that's wrong. The **Virtual DOM** is the kitchen's
notepad: it jots down what *should* be on every table, compares it to what's actually there,
and sends the waiter to fix only the mismatched plates. Repainting the whole room every time
someone asks for extra napkins would be exhausting — and slow.

> **Pro tip:** Components should be *pure* with respect to props and state — given the same
> inputs, they should render the same output. Side effects (fetching data, subscriptions)
> belong in `useEffect`, not directly in the render body.
