import type { Context } from '@netlify/functions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../services/auth/sessions.ts'

const readingService = vi.hoisted(() => ({
  getPosition: vi.fn(),
  savePosition: vi.fn(),
  setResumeReading: vi.fn(),
}))
vi.mock('../../services/reading.ts', () => ({ readingService }))

const { default: reading } = await import('../reading.ts')
const { default: preferences } = await import('../profile-preferences.ts')

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const ctx = (topic = 'aws-saa-c03') => ({ params: { topic } }) as unknown as Context
const position = { lessonSlug: 'vpc-networking', sectionId: 'subnets' }

async function call(handler: typeof reading, method: string, { body, userId = 'u1', context = ctx() }: { body?: unknown; userId?: string | null; context?: Context } = {}) {
  const headers: Record<string, string> = body === undefined ? {} : { 'content-type': 'application/json' }
  if (userId) headers.cookie = `session=${await createSessionToken(userId, SECRET)}`
  return handler(new Request('https://aws.io.vn/api/x', { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), context)
}

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id')
  Object.values(readingService).forEach((mock) => mock.mockReset())
})
afterEach(() => { vi.unstubAllEnvs() })

describe('/api/reading/:topic', () => {
  it.each(['GET', 'PUT', 'POST'])('%s without a session is 401 and touches nothing', async (method) => {
    const response = await call(reading, method, { userId: null, body: method === 'GET' ? undefined : position })
    expect(response.status).toBe(401)
    expect(readingService.getPosition).not.toHaveBeenCalled()
    expect(readingService.savePosition).not.toHaveBeenCalled()
  })

  it('reads only the cookie user\'s position', async () => {
    readingService.getPosition.mockResolvedValue({ ...position, updatedAt: '2026-10-12T00:00:00.000Z' })
    const response = await call(reading, 'GET', { userId: 'u2' })
    expect(await response.json()).toEqual({ position: { ...position, updatedAt: '2026-10-12T00:00:00.000Z' } })
    expect(readingService.getPosition).toHaveBeenCalledWith('u2', 'aws-saa-c03')
  })

  it.each(['PUT', 'POST'])('%s upserts for the cookie user (POST is the sendBeacon path)', async (method) => {
    readingService.savePosition.mockResolvedValue(true)
    const response = await call(reading, method, { body: position })
    expect(await response.json()).toEqual({ saved: true })
    expect(readingService.savePosition).toHaveBeenCalledWith('u1', 'aws-saa-c03', position)
  })

  it('rejects a userId in the body instead of trusting it', async () => {
    const response = await call(reading, 'PUT', { body: { ...position, userId: 'someone-else' } })
    expect(response.status).toBe(400)
    expect(readingService.savePosition).not.toHaveBeenCalled()
  })

  it.each([
    ['bad section id', { ...position, sectionId: 'Has Spaces' }],
    ['bad lesson slug', { ...position, lessonSlug: '../etc' }],
    ['missing section', { lessonSlug: 'vpc-networking' }],
  ])('answers 400 for %s', async (_label, body) => {
    expect((await call(reading, 'PUT', { body })).status).toBe(400)
  })

  it('answers 400 for an invalid topic', async () => {
    expect((await call(reading, 'GET', { context: ctx('../x') })).status).toBe(400)
  })
})

describe('PUT /api/profile/preferences', () => {
  it('saves the setting for the cookie user and returns the public user', async () => {
    readingService.setResumeReading.mockResolvedValue({
      id: 'u1', email: 'a@x.io', name: null, passwordHash: null, googleSub: 's', emailVerified: true,
      avatarUrl: null, hobbies: [], techStack: [], bio: '', resumeReading: false,
    })
    const response = await call(preferences, 'PUT', { body: { resumeReading: false } })
    expect(response.status).toBe(200)
    expect(((await response.json()) as { user: { preferences: unknown } }).user.preferences).toEqual({ resumeReading: false })
    expect(readingService.setResumeReading).toHaveBeenCalledWith('u1', false)
  })

  it('answers 401 without a session and 400 for non-boolean input', async () => {
    expect((await call(preferences, 'PUT', { userId: null, body: { resumeReading: true } })).status).toBe(401)
    expect((await call(preferences, 'PUT', { body: { resumeReading: 'yes' } })).status).toBe(400)
    expect(readingService.setResumeReading).not.toHaveBeenCalled()
  })
})
