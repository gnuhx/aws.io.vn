import type { Context } from '@netlify/functions'
import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../services/auth/sessions.ts'
import { json, publicEndpoint, withAuth } from './http.ts'

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const context = { params: {} } as unknown as Context

const request = (init: RequestInit & { cookie?: string } = {}) => {
  const headers = new Headers(init.headers)
  if (init.cookie) headers.set('cookie', init.cookie)
  return new Request('https://aws.io.vn/api/test', { ...init, headers })
}

describe('withAuth', () => {
  const handler = vi.fn(async (_request: Request, _context: Context, auth: { userId: string }) => json(auth))
  const endpoint = withAuth(handler)

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', SECRET)
    vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id')
    handler.mockClear()
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it('passes the user id from a valid session cookie', async () => {
    const token = await createSessionToken('user-1', SECRET)
    const response = await endpoint(request({ cookie: `other=1; session=${token}` }), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ userId: 'user-1' })
  })

  it('rejects a missing, tampered, wrongly signed or expired cookie without calling the handler', async () => {
    const valid = await createSessionToken('user-1', SECRET)
    const wrongKey = await createSessionToken('user-1', 'another-secret-that-is-at-least-32-chars')
    const expired = await new SignJWT().setProtectedHeader({ alg: 'HS256' }).setSubject('user-1')
      .setIssuedAt(1).setExpirationTime(2).sign(new TextEncoder().encode(SECRET))

    for (const cookie of [undefined, `session=${valid}x`, `session=${wrongKey}`, `session=${expired}`]) {
      expect((await endpoint(request({ cookie }), context)).status).toBe(401)
    }
    expect(handler).not.toHaveBeenCalled()
  })

  it('answers 503 instead of crashing when JWT_SECRET is missing or too short', async () => {
    vi.stubEnv('JWT_SECRET', 'short')
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await endpoint(request({ cookie: 'session=abc' }), context)
    expect(response.status).toBe(503)
    expect(errors.mock.calls.flat().join(' ')).not.toContain('short')
    errors.mockRestore()
  })
})

describe('publicEndpoint', () => {
  const endpoint = publicEndpoint(async () => json({ ok: true }))
  afterEach(() => { vi.unstubAllEnvs() })

  it('rejects state-changing requests from an untrusted origin', async () => {
    const response = await endpoint(request({ method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' } }), context)
    expect(response.status).toBe(403)
  })

  it('rejects state-changing requests that are not JSON', async () => {
    const response = await endpoint(request({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } }), context)
    expect(response.status).toBe(415)
  })

  it('accepts same-origin JSON requests', async () => {
    const response = await endpoint(request({ method: 'POST', headers: { origin: 'https://aws.io.vn', 'content-type': 'application/json' } }), context)
    expect(response.status).toBe(200)
  })

  it('adds CORS credentials headers only for origins in ALLOWED_ORIGINS', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:5173')
    const allowed = await endpoint(request({ headers: { origin: 'http://localhost:5173' } }), context)
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(allowed.headers.get('access-control-allow-credentials')).toBe('true')

    const other = await endpoint(request({ headers: { origin: 'https://evil.example' } }), context)
    expect(other.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('maps unexpected errors to 500 without leaking details', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = publicEndpoint(async () => { throw new Error('db password is hunter2') })
    const response = await failing(request(), context)
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('hunter2')
    errors.mockRestore()
  })
})
