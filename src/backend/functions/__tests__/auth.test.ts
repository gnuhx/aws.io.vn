import type { Context } from '@netlify/functions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../../repositories/users.ts'
import { createSessionToken } from '../../services/auth/sessions.ts'

const authService = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  findUser: vi.fn(),
}))
vi.mock('../../services/auth/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/auth/index.ts')>()),
  authService,
}))

const { default: register } = await import('../auth-register.ts')
const { default: login } = await import('../auth-login.ts')
const { default: google } = await import('../auth-google.ts')
const { default: me } = await import('../auth-me.ts')
const { default: logout } = await import('../auth-logout.ts')

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const context = { params: {} } as unknown as Context
const user: User = { id: 'u1', email: 'a@x.io', name: null, passwordHash: '$2b$12$hash', googleSub: null, emailVerified: false }

const post = (body: unknown, raw = false) => new Request('https://aws.io.vn/api/auth/x', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: raw ? (body as string) : JSON.stringify(body),
})

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id')
  Object.values(authService).forEach((mock) => mock.mockReset())
})
afterEach(() => { vi.unstubAllEnvs() })

describe('POST /api/auth/register', () => {
  it('creates the user, returns it without the hash and sets the session cookie', async () => {
    authService.register.mockResolvedValue(user)
    const response = await register(post({ email: 'A@X.io', password: 'correct horse' }), context)
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ user: { id: 'u1', email: 'a@x.io', name: null } })
    expect(response.headers.get('set-cookie')).toMatch(/^session=.+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800$/)
    expect(authService.register).toHaveBeenCalledWith({ email: 'a@x.io', password: 'correct horse' })
  })

  it('answers 409 for a taken email', async () => {
    authService.register.mockResolvedValue(null)
    expect((await register(post({ email: 'a@x.io', password: 'correct horse' }), context)).status).toBe(409)
  })

  it.each([
    ['bad email', { email: 'nope', password: 'correct horse' }],
    ['short password', { email: 'a@x.io', password: 'short' }],
    ['over-long password', { email: 'a@x.io', password: 'x'.repeat(73) }],
    ['empty body', {}],
  ])('answers 400 for %s without touching the service', async (_label, body) => {
    expect((await register(post(body), context)).status).toBe(400)
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('answers 400 for a non-JSON body', async () => {
    expect((await register(post('{not json', true), context)).status).toBe(400)
    expect(authService.register).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/login', () => {
  it('sets the session cookie for the right password', async () => {
    authService.login.mockResolvedValue(user)
    const response = await login(post({ email: 'a@x.io', password: 'correct horse' }), context)
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  })

  it('gives the same 401 answer for a wrong password and an unknown email', async () => {
    authService.login.mockResolvedValue(null)
    const wrong = await login(post({ email: 'a@x.io', password: 'wrong' }), context)
    const unknown = await login(post({ email: 'nobody@x.io', password: 'wrong' }), context)
    expect([wrong.status, unknown.status]).toEqual([401, 401])
    expect(await wrong.json()).toEqual(await unknown.json())
    expect(wrong.headers.get('set-cookie')).toBeNull()
  })
})

describe('POST /api/auth/google', () => {
  it('passes only the credential to the service, ignoring identity fields in the body', async () => {
    authService.loginWithGoogle.mockResolvedValue({ ok: true, user })
    const response = await google(post({ credential: 'id-token', email: 'victim@x.io', userId: 'victim' }), context)
    expect(response.status).toBe(200)
    expect(authService.loginWithGoogle).toHaveBeenCalledWith('id-token')
  })

  it('answers 401 for an invalid token and 403 for an unverified email, without a cookie', async () => {
    authService.loginWithGoogle.mockResolvedValueOnce({ ok: false, reason: 'invalid_token' })
    const invalid = await google(post({ credential: 'forged' }), context)
    authService.loginWithGoogle.mockResolvedValueOnce({ ok: false, reason: 'email_unverified' })
    const unverified = await google(post({ credential: 'tok' }), context)
    expect([invalid.status, unverified.status]).toEqual([401, 403])
    expect(invalid.headers.get('set-cookie')).toBeNull()
  })
})

describe('GET /api/auth/me and POST /api/auth/logout', () => {
  const get = (cookie?: string) => new Request('https://aws.io.vn/api/auth/me', { headers: cookie ? { cookie } : {} })

  it('returns the signed-in user without the password hash', async () => {
    authService.findUser.mockResolvedValue(user)
    const response = await me(get(`session=${await createSessionToken('u1', SECRET)}`), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user: { id: 'u1', email: 'a@x.io', name: null } })
    expect(authService.findUser).toHaveBeenCalledWith('u1')
  })

  it('answers 401 without a cookie', async () => {
    expect((await me(get(), context)).status).toBe(401)
  })

  it('clears the cookie on logout', async () => {
    const response = await logout(post({}), context)
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
