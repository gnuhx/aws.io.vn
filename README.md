# aws.io.vn — AWS Learning Blog

A personal blog for AWS learning notes. Frontend only (React + TypeScript + Vite).
Posts are stored as local mock data. Deployed to Netlify.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM v6
- Plain CSS

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Deploy to Netlify

1. Push to GitHub.
2. Import the repo into Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. The `netlify.toml` file handles the rest (SPA redirect rule).

## Project Structure

```
src/
├── components/     # Reusable UI components (Header, PostCard)
├── data/           # Mock post data — replace with API calls later
├── pages/          # Route-level page components
├── types/          # TypeScript interfaces
├── App.tsx         # Router setup
├── main.tsx        # React entry point
└── index.css       # Global base styles
```

## Adding a New Post

Open [src/data/posts.ts](src/data/posts.ts) and add a new object to the `posts` array:

```ts
{
  id: 'my-new-post',          // used in the URL: /post/my-new-post
  title: 'My New Post',
  excerpt: 'Short summary shown on the home page.',
  date: '2025-05-01',
  readTime: 5,
  tags: ['Tag1', 'Tag2'],
  content: `<h2>Section</h2><p>Your HTML content here.</p>`,
}
```

## Future: Connecting to a C# ASP.NET Core API on EC2

When the backend is ready, replace the mock data import in each page with a `fetch` call:

```ts
// Before (mock)
import { posts } from '../data/posts';

// After (API)
const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`);
const posts = await res.json();
```

Set `VITE_API_BASE_URL` in Netlify → Site settings → Environment variables.
