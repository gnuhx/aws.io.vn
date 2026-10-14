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
  // changeOrigin must stay false (the string shorthand turns it on): the functions build request.url from
  // the Host header, and the CSRF check compares it to the browser's Origin (TASK-011).
  server: {
    proxy: { '/api': { target: 'http://localhost:8888', changeOrigin: false } },
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
    maxWorkers: 4,
    coverage: {
      include: ['**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/test/**',
        '../backend/functions/__tests__/**',
        '../backend/repositories/**',
        'src/backend/repositories/**',
        'main.tsx',
        'src/frontend/main.tsx',
        '../../vite.config.ts',
        'vite.config.ts',
      ],
      allowExternal: true,
      reportsDirectory: fromRoot('./coverage'),
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        '../shared/**': { lines: 95, perFile: { lines: 95 } },
        '../backend/services/**': { lines: 90, perFile: { lines: 45 } },
        '../backend/functions/**': { lines: 95, perFile: { lines: 85 } },
        '**/*.{ts,tsx}': { lines: 75 },
      },
    },
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
