import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { profileUpdateSchema } from '../../shared/schemas/profile.ts'
import { json, readJson, withAuth } from '../middleware/http.ts'
import { signedOutResponse } from '../middleware/session.ts'
import { authService, toProfile, toPublicUser } from '../services/auth/index.ts'

// The profile is always the cookie user's; no user ID is ever read from the request.
export default withAuth(async (request, _context, { userId }) => {
  if (request.method === 'GET') {
    const user = await authService.findUser(userId)
    if (!user) return signedOutResponse({ error: 'unauthorized' }, 401)
    return json({ user: toPublicUser(user), profile: toProfile(user) })
  }

  if (request.method === 'PUT') {
    const parsed = profileUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success) return json({ error: 'Check the highlighted fields', fields: z.flattenError(parsed.error).fieldErrors }, 400)
    const user = await authService.updateProfile(userId, parsed.data)
    if (!user) return signedOutResponse({ error: 'unauthorized' }, 401)
    return json({ user: toPublicUser(user), profile: toProfile(user) })
  }

  return json({ error: 'method not allowed' }, 405)
})

export const config: Config = { path: '/api/profile' }
