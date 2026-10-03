import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
  build: {
    outDir: fromRoot('./dist'),
    emptyOutDir: true,
  },
})
