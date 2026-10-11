import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config.ts'

// TASK-011: with changeOrigin on, the functions see Host localhost:8888 while the browser sends
// Origin localhost:5173, and the CSRF check rejects every POST in local dev.
describe('Vite dev proxy for /api', () => {
  it('keeps the browser Host header so request.url matches the Origin', () => {
    expect(viteConfig.server?.proxy?.['/api']).toEqual({ target: 'http://localhost:8888', changeOrigin: false })
  })
})
