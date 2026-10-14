import type { Config } from '@netlify/functions'
import { readingPositionSchema, readingTopicSchema } from '../../shared/schemas/reading.ts'
import { json, readJson, withAuth } from '../middleware/http.ts'
import { readingService } from '../services/reading.ts'

// The owner always comes from the verified session cookie; bodies are strict, so a `userId` field is a 400.
export default withAuth(async (request, context, { userId }) => {
  const topic = readingTopicSchema.safeParse(context.params.topic ?? '')
  if (!topic.success) return json({ error: 'invalid topic' }, 400)

  if (request.method === 'GET') {
    return json({ position: await readingService.getPosition(userId, topic.data) })
  }

  // POST is the same upsert as PUT: navigator.sendBeacon can only POST.
  if (request.method === 'PUT' || request.method === 'POST') {
    const parsed = readingPositionSchema.safeParse(await readJson(request))
    if (!parsed.success) return json({ error: 'invalid reading position' }, 400)
    return json({ saved: await readingService.savePosition(userId, topic.data, parsed.data) })
  }

  return json({ error: 'method not allowed' }, 405)
})

export const config: Config = { path: '/api/reading/:topic' }
