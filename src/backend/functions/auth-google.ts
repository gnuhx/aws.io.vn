import type { Config } from '@netlify/functions'
import { googleLoginSchema } from '../../shared/schemas/auth.ts'
import { json, publicEndpoint, readJson } from '../middleware/http.ts'
import { signedInResponse } from '../middleware/session.ts'
import { authService } from '../services/auth/index.ts'

export default publicEndpoint(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  const parsed = googleLoginSchema.safeParse(await readJson(request))
  if (!parsed.success) return json({ error: 'invalid input' }, 400)

  const result = await authService.loginWithGoogle(parsed.data.credential)
  if (!result.ok) {
    return result.reason === 'email_unverified'
      ? json({ error: 'Your Google account email is not verified' }, 403)
      : json({ error: 'Google sign-in failed' }, 401)
  }
  return signedInResponse(result.user)
})

export const config: Config = { path: '/api/auth/google' }
