import { describe, expect, it } from 'vitest'

// Guards the test setup (D-006): backend code runs in Node, so its tests must not get a fake DOM.
describe('backend test environment', () => {
  it('runs in Node without a DOM', () => {
    // Checked via globalThis: `window` isn't even a known name under tsconfig.node.json.
    expect('window' in globalThis).toBe(false)
    expect('document' in globalThis).toBe(false)
    expect(process.versions.node).toBeDefined()
  })
})
