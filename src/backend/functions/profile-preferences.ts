import type { Config } from '@netlify/functions'
import { preferencesSchema } from '../../shared/schemas/profile.ts'
import { json, readJson, withAuth } from '../middleware/http.ts'
import { signedOutResponse } from '../middleware/session.ts'
import { toPublicUser } from '../services/auth/index.ts'
import { readingService } from '../services/reading.ts'

export default withAuth(async (request, _context, { userId }) => {
  if (request.method !== 'PUT') return json({ error: 'method not allowed' }, 405)
  const parsed = preferencesSchema.safeParse(await readJson(request))
  if (!parsed.success) return json({ error: 'invalid preferences' }, 400)

  const user = await readingService.setResumeReading(userId, parsed.data.resumeReading)
  if (!user) return signedOutResponse({ error: 'unauthorized' }, 401)
  return json({ user: toPublicUser(user) })
})

export const config: Config = { path: '/api/profile/preferences' }
