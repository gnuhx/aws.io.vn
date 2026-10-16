import type { Config } from '@netlify/functions'
import { isLessonProgressId } from '../../shared/lessonProgress.ts'
import { isAllowedProgressStatus, isTrackableProgressItem, lessonsReadSchema } from '../../shared/schemas/roadmap-progress.ts'
import { progressDeleteSchema, progressReadParamsSchema, progressUpdateSchema } from '../../shared/schemas/roadmap-progress.ts'
import { json, readJson, withAuth } from '../middleware/http.ts'
import { clearStatus, listStatuses, markLessonsRead, setStatus } from '../services/progress.ts'

// The owner always comes from the verified session cookie, never from the request.
export default withAuth(async (request, context, { userId }) => {
  const roadmapResult = progressReadParamsSchema.safeParse({ roadmapId: context.params.roadmapId ?? '' })
  if (!roadmapResult.success) return json({ error: 'invalid roadmap id' }, 400)
  const { roadmapId } = roadmapResult.data

  if (request.method === 'GET') {
    return json({ statuses: await listStatuses(userId, roadmapId) })
  }

  if (request.method === 'PUT') {
    const body = await readJson(request)
    const parsed = progressUpdateSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), roadmapId })
    if (!parsed.success || !isAllowedProgressStatus(roadmapId, parsed.data.itemId, parsed.data.status)) {
      return json({ error: 'invalid progress item or status' }, 400)
    }
    await setStatus(userId, roadmapId, parsed.data.itemId, parsed.data.status)
    return json({ itemId: parsed.data.itemId, status: parsed.data.status })
  }

  // Marks several lessons read at once. All-or-nothing: one unknown or non-lesson ID rejects the whole request.
  if (request.method === 'POST') {
    const body = await readJson(request)
    const parsed = lessonsReadSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), roadmapId })
    if (!parsed.success || !parsed.data.lessonIds.every((lessonId) => isLessonProgressId(roadmapId, lessonId))) {
      return json({ error: 'invalid lesson ids' }, 400)
    }
    await markLessonsRead(userId, roadmapId, parsed.data.lessonIds)
    return json({ lessonIds: [...new Set(parsed.data.lessonIds)], status: 'completed' })
  }

  if (request.method === 'DELETE') {
    const body = await readJson(request)
    const parsed = progressDeleteSchema.safeParse({ ...(body && typeof body === 'object' ? body : {}), roadmapId })
    if (!parsed.success || !isTrackableProgressItem(roadmapId, parsed.data.itemId)) {
      return json({ error: 'invalid progress item' }, 400)
    }
    await clearStatus(userId, roadmapId, parsed.data.itemId)
    return json({ itemId: parsed.data.itemId, status: 'not_started' })
  }

  return json({ error: 'method not allowed' }, 405)
})

export const config: Config = { path: '/api/progress/:roadmapId' }
