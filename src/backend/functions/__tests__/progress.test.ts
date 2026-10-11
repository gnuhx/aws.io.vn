import type { Context } from '@netlify/functions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../services/auth/sessions.ts'

const progressService = vi.hoisted(() => ({
  listStatuses: vi.fn(),
  setStatus: vi.fn(),
  clearStatus: vi.fn(),
}))
vi.mock('../../services/progress.ts', () => progressService)

const { default: progress } = await import('../progress.ts')

const SECRET = 'test-secret-that-is-at-least-32-characters-long'
const LESSON = 'aws-saa-c03:lesson-0001'
const ITEM = 'aws-saa-c03:item-0001'
const contextFor = (roadmapId: string) => ({ params: { roadmapId } }) as unknown as Context

const cookieFor = async (userId: string) => `session=${await createSessionToken(userId, SECRET)}`

function call(method: string, { cookie, body, roadmapId = 'aws-saa-c03' }: { cookie?: string; body?: unknown; roadmapId?: string } = {}) {
  const headers: Record<string, string> = {}
  if (cookie) headers.cookie = cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  const request = new Request(`https://aws.io.vn/api/progress/${roadmapId}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return progress(request, contextFor(roadmapId))
}

const nothingWritten = () => {
  expect(progressService.setStatus).not.toHaveBeenCalled()
  expect(progressService.clearStatus).not.toHaveBeenCalled()
}

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', SECRET)
  vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id')
  Object.values(progressService).forEach((mock) => mock.mockReset())
})
afterEach(() => { vi.unstubAllEnvs() })

describe('/api/progress/:roadmapId auth', () => {
  it.each(['GET', 'PUT', 'DELETE'])('%s without a session cookie is 401 and touches nothing', async (method) => {
    const response = await call(method, { body: method === 'GET' ? undefined : { itemId: LESSON, status: 'completed' } })
    expect(response.status).toBe(401)
    expect(progressService.listStatuses).not.toHaveBeenCalled()
    nothingWritten()
  })

  it('rejects a tampered session cookie', async () => {
    const response = await call('PUT', { cookie: `${await cookieFor('u1')}x`, body: { itemId: LESSON, status: 'completed' } })
    expect(response.status).toBe(401)
    nothingWritten()
  })

  it("reads only the signed-in user's progress", async () => {
    progressService.listStatuses.mockResolvedValue({ [LESSON]: 'completed' })
    const response = await call('GET', { cookie: await cookieFor('user-b') })
    expect(await response.json()).toEqual({ statuses: { [LESSON]: 'completed' } })
    expect(progressService.listStatuses).toHaveBeenCalledWith('user-b', 'aws-saa-c03')
  })
})

describe('lesson read tracking', () => {
  it('marks a lesson read as a completed record owned by the cookie user', async () => {
    const response = await call('PUT', { cookie: await cookieFor('u1'), body: { itemId: LESSON, status: 'completed' } })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ itemId: LESSON, status: 'completed' })
    expect(progressService.setStatus).toHaveBeenCalledWith('u1', 'aws-saa-c03', LESSON, 'completed')
  })

  it('marks a lesson unread by deleting only that record', async () => {
    const response = await call('DELETE', { cookie: await cookieFor('u1'), body: { itemId: LESSON } })
    expect(response.status).toBe(200)
    expect(progressService.clearStatus).toHaveBeenCalledTimes(1)
    expect(progressService.clearStatus).toHaveBeenCalledWith('u1', 'aws-saa-c03', LESSON)
    expect(progressService.setStatus).not.toHaveBeenCalled()
  })

  it('rejects a client-supplied user ID instead of trusting it', async () => {
    const response = await call('PUT', { cookie: await cookieFor('u1'), body: { itemId: LESSON, status: 'completed', userId: 'victim' } })
    expect(response.status).toBe(400)
    nothingWritten()
  })

  it.each([
    ['unknown lesson ID', 'aws-saa-c03', { itemId: 'aws-saa-c03:lesson-9999', status: 'completed' }],
    ['lesson ID from another roadmap', 'aws-saa-c03', { itemId: 'MCP:lesson-0001', status: 'completed' }],
    ['lesson slug instead of ID', 'aws-saa-c03', { itemId: 'module-3-vpc-networking', status: 'completed' }],
    ['in_progress for a lesson', 'aws-saa-c03', { itemId: LESSON, status: 'in_progress' }],
    ['unsupported status', 'aws-saa-c03', { itemId: LESSON, status: 'read' }],
    ['unknown roadmap', 'nope', { itemId: LESSON, status: 'completed' }],
  ])('answers 400 for %s without writing', async (_label, roadmapId, body) => {
    const response = await call('PUT', { cookie: await cookieFor('u1'), body, roadmapId })
    expect(response.status).toBe(400)
    nothingWritten()
  })

  it('answers 400 when unread targets an unknown lesson', async () => {
    const response = await call('DELETE', { cookie: await cookieFor('u1'), body: { itemId: 'aws-saa-c03:lesson-9999' } })
    expect(response.status).toBe(400)
    nothingWritten()
  })

  it('keeps in_progress available for roadmap items', async () => {
    const response = await call('PUT', { cookie: await cookieFor('u1'), body: { itemId: ITEM, status: 'in_progress' } })
    expect(response.status).toBe(200)
    expect(progressService.setStatus).toHaveBeenCalledWith('u1', 'aws-saa-c03', ITEM, 'in_progress')
  })
})
