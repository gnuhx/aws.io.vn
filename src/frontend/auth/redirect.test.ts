import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirect.ts'

describe('safeRedirect', () => {
  it('keeps same-site paths and replaces everything else with /', () => {
    expect(safeRedirect('/MCP/roadmap?x=1')).toBe('/MCP/roadmap?x=1')
    for (const value of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
      expect(safeRedirect(value)).toBe('/')
    }
  })
})
