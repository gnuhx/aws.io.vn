import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// D-007: every endpoint is wrapped in withAuth(...) or explicitly marked publicEndpoint(...).
describe('functions folder', () => {
  const folder = new URL('..', import.meta.url)
  const endpoints = readdirSync(folder).filter((file) => file.endsWith('.ts'))

  it.each(endpoints)('%s declares its access level', (file) => {
    const source = readFileSync(new URL(file, folder), 'utf8')
    expect(source).toMatch(/export default (withAuth|publicEndpoint)\(/)
  })
})
