import type { Config } from '@netlify/functions'
import { progressReadParamsSchema } from '../../shared/schemas/roadmap-progress.ts'
import { json, withAuth } from '../middleware/http.ts'
import { listActivity } from '../services/progress.ts'

const HISTORY_DAYS = 366

// Learning-calendar history for the cookie's user; read-only.
export default withAuth(async (request, context, { userId }) => {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405)
  const roadmapResult = progressReadParamsSchema.safeParse({ roadmapId: context.params.roadmapId ?? '' })
  if (!roadmapResult.success) return json({ error: 'invalid roadmap id' }, 400)

  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
  const events = await listActivity(userId, roadmapResult.data.roadmapId, since)
  return json({ activity: events.map(({ itemId, status, at }) => ({ itemId, status, at: at.toISOString() })) })
})

export const config: Config = { path: '/api/progress/:roadmapId/activity' }
