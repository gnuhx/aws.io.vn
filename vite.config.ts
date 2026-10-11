import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
// Frontend lives in src/frontend (D-003); build output stays at the repo root for Netlify.
export default defineConfig({
  root: fromRoot('./src/frontend'),
  envDir: fromRoot('./'),
  plugins: [react()],
  resolve: {
    alias: { '@shared': fromRoot('./src/shared') },
  },
  // Dev: the browser stays on http://localhost:5173 and /api goes to `netlify dev` (port 8888), which runs the
  // functions. Same origin for the browser, so the session cookie flows without CORS.
  server: {
    proxy: { '/api': 'http://localhost:8888' },
  },
  build: {
    outDir: fromRoot('./dist'),
    emptyOutDir: true,
  },
  // https://vitest.dev/guide/projects
  // One project per runtime (D-006), like the two tsconfigs. Each project inherits the plugins
  // and alias above (extends: true) but resets root to the repo, since Vite's root is
  // src/frontend and backend tests would otherwise never be found.
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'frontend',
          root: fromRoot('./'),
          include: ['src/frontend/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['src/frontend/test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'backend',
          root: fromRoot('./'),
          // Shared code must run in Node too, so it is tested here without a DOM.
          include: ['src/backend/**/*.test.ts', 'src/shared/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
