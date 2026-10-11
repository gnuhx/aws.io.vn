import { describe, expect, it } from 'vitest'
import { clearedSessionCookie, readSessionCookie, sessionCookie } from './sessions.ts'

describe('session cookie', () => {
  it('is httpOnly, Secure, SameSite=Lax, site-wide and lasts 7 days', () => {
    const cookie = sessionCookie('token')
    for (const attribute of ['session=token', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=604800']) {
      expect(cookie).toContain(attribute)
    }
  })

  it('is cleared with Max-Age=0 and the same attributes', () => {
    expect(clearedSessionCookie()).toMatch(/^session=; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=0$/)
  })

  it('is read from a Cookie header among other cookies', () => {
    const request = new Request('https://aws.io.vn', { headers: { cookie: 'a=1; session=abc.def.ghi; b=2' } })
    expect(readSessionCookie(request)).toBe('abc.def.ghi')
    expect(readSessionCookie(new Request('https://aws.io.vn'))).toBeNull()
  })
})
