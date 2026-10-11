import type { Config } from '@netlify/functions'
import { json, withAuth } from '../middleware/http.ts'
import { signedOutResponse } from '../middleware/session.ts'
import { authService, toPublicUser } from '../services/auth/index.ts'

export default withAuth(async (request, _context, { userId }) => {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405)
  const user = await authService.findUser(userId)
  // Valid token for a user that no longer exists: drop the stale cookie.
  if (!user) return signedOutResponse({ error: 'unauthorized' }, 401)
  return json({ user: toPublicUser(user) })
})

export const config: Config = { path: '/api/auth/me' }
