import type { Context } from '@netlify/functions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../../repositories/users.ts'
import { createSessionToken } from '../../services/auth/sessions.ts'

const authService = vi.hoisted(() => ({
  findUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}))
vi.mock('../../services/auth/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/auth/index.ts')>()),
  authService,
}))

const { default: profile } = await import('../profile.ts')
const { default: password } = await import('../profile-password.ts')

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const context = { params: {} } as unknown as Context
const user: User = {
  id: 'u1', email: 'a@x.io', name: 'Ada', passwordHash: '$2b$12$hash', googleSub: null, emailVerified: false,
  avatarUrl: 'https://lh3.googleusercontent.com/a/x', hobbies: ['chess'], techStack: ['AWS'], bio: 'Hi',
}

async function request(method: string, path: string, body?: unknown, signedIn = true) {
  const headers: Record<string, string> = body === undefined ? {} : { 'content-type': 'application/json' }
  if (signedIn) headers.cookie = `session=${await createSessionToken('u1', SECRET)}`
  return new Request(`https://aws.io.vn${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id')
  Object.values(authService).forEach((mock) => mock.mockReset())
})
afterEach(() => { vi.unstubAllEnvs() })

describe('/api/profile', () => {
  it('answers 401 without a session for every method', async () => {
    expect((await profile(await request('GET', '/api/profile', undefined, false), context)).status).toBe(401)
    expect((await profile(await request('PUT', '/api/profile', {}, false), context)).status).toBe(401)
    expect((await password(await request('POST', '/api/profile/password', {}, false), context)).status).toBe(401)
    expect(authService.findUser).not.toHaveBeenCalled()
  })

  it('returns the cookie user and their profile, never the hash', async () => {
    authService.findUser.mockResolvedValue(user)
    const response = await profile(await request('GET', '/api/profile'), context)
    expect(await response.json()).toEqual({
      user: { id: 'u1', email: 'a@x.io', name: 'Ada', avatarUrl: 'https://lh3.googleusercontent.com/a/x', hasPassword: true },
      profile: { hobbies: ['chess'], techStack: ['AWS'], bio: 'Hi' },
    })
    expect(authService.findUser).toHaveBeenCalledWith('u1')
  })

  it('saves normalized input for the cookie user', async () => {
    authService.updateProfile.mockResolvedValue({ ...user, name: null, techStack: ['AWS', 'React'] })
    const response = await profile(await request('PUT', '/api/profile', {
      name: '  ', hobbies: [' chess ', 'Chess', ''], techStack: ['AWS', 'React'], bio: ' Hi ',
    }), context)
    expect(response.status).toBe(200)
    expect(authService.updateProfile).toHaveBeenCalledWith('u1', { name: null, hobbies: ['chess'], techStack: ['AWS', 'React'], bio: 'Hi' })
  })

  it('answers 400 with field errors for invalid input and unknown fields', async () => {
    const tooLong = await profile(await request('PUT', '/api/profile', { name: '', hobbies: [], techStack: [], bio: 'x'.repeat(501) }), context)
    expect(tooLong.status).toBe(400)
    expect(((await tooLong.json()) as { fields: Record<string, string[]> }).fields.bio).toEqual(['Use at most 500 characters'])
    const sneaky = await profile(await request('PUT', '/api/profile', { name: '', hobbies: [], techStack: [], bio: '', email: 'b@x.io' }), context)
    expect(sneaky.status).toBe(400)
    expect(authService.updateProfile).not.toHaveBeenCalled()
  })
})

describe('POST /api/profile/password', () => {
  it('changes the password for the cookie user', async () => {
    authService.changePassword.mockResolvedValue({ ok: true })
    const response = await password(await request('POST', '/api/profile/password', { currentPassword: 'old pass!', newPassword: 'battery staple' }), context)
    expect(response.status).toBe(200)
    expect(authService.changePassword).toHaveBeenCalledWith('u1', { currentPassword: 'old pass!', newPassword: 'battery staple' })
  })

  it('maps a wrong current password to a field error', async () => {
    authService.changePassword.mockResolvedValue({ ok: false, reason: 'wrong_password' })
    const response = await password(await request('POST', '/api/profile/password', { currentPassword: 'nope', newPassword: 'battery staple' }), context)
    expect(response.status).toBe(400)
    expect(((await response.json()) as { fields: unknown }).fields).toEqual({ currentPassword: ['Current password is incorrect'] })
  })

  it('rejects a weak new password before calling the service', async () => {
    const response = await password(await request('POST', '/api/profile/password', { currentPassword: 'x', newPassword: 'short' }), context)
    expect(response.status).toBe(400)
    expect(authService.changePassword).not.toHaveBeenCalled()
  })
})
