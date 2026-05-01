# AWS Learning Blog - Frontend UI Specification

## 1. Project Overview

I want to build a personal blog website to write about what I have learned while studying AWS.

This version is frontend only.

There is no backend yet. Blog posts will be stored as local mock data inside the React project. Later, I will add a C# ASP.NET Core API backend and deploy that backend to EC2.

The frontend will be deployed to Netlify.

## 2. Tech Stack

Use:

- React
- TypeScript
- Vite
- React Router DOM
- Plain CSS
- Netlify for deployment

Do not use:

- Backend API
- Database
- Authentication
- Admin dashboard
- Markdown parser
- UI component library
- Tailwind CSS

Keep everything simple, clean, and easy to extend later.

## 3. Main Goal

Build a clean Medium-style AWS learning blog.

The site should allow users to:

1. View all blog posts on the homepage.
2. Click a blog post.
3. Read the full article on a detail page.
4. Go back to the homepage.
5. See a simple 404 page if the route does not exist.

## 4. Design Style

The UI should feel similar to Medium:

- Clean white background
- Minimal header
- Strong typography
- Lots of whitespace
- Article content is easy to read
- No heavy colors
- No complex layout
- No sidebar
- No footer required for MVP
- Mobile friendly

Use mostly:

- White: `#ffffff`
- Text black: `#191919`
- Gray text: `#6b6b6b`
- Light border: `#e6e6e6`
- AWS orange accent: `#ff9900`

## 5. Pages

### 5.1 Home Page

Route:

```txt
/