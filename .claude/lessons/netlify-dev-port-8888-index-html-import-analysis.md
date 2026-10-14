# Vite "Failed to parse source for import analysis … index.html" on every load

- Seen: 2026-10-11, local dev with `npx netlify-cli dev`

## What happened
The app was opened on http://localhost:8888 (netlify dev's port, which it auto-opened). netlify dev applies the
production SPA rule from `netlify.toml` (`/* → /index.html`, status 200) before proxying to Vite, so module requests
such as `/main.tsx` and `/@vite/client` got `index.html` back, and Vite tried to parse that HTML as JavaScript.
Verified with curl: on :8888 `/main.tsx` returned `text/html`; on :5173 it returned `text/javascript`.

## How to fix
Open http://localhost:5173. Vite proxies `/api/*` to :8888, so the functions and session cookie still work.
`netlify.toml` now sets `[dev] autoLaunch = false` so netlify dev no longer opens :8888.
