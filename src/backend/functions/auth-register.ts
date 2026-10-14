import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { registerSchema } from '../../shared/schemas/auth.ts'
import { json, publicEndpoint, readJson } from '../middleware/http.ts'
import { signedInResponse } from '../middleware/session.ts'
import { authService } from '../services/auth/index.ts'

export default publicEndpoint(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  const parsed = registerSchema.safeParse(await readJson(request))
  if (!parsed.success) return json({ error: 'invalid input', fields: z.flattenError(parsed.error).fieldErrors }, 400)

  const user = await authService.register(parsed.data)
  if (!user) return json({ error: 'An account with this email already exists' }, 409)
  return signedInResponse(user, 201)
})

export const config: Config = { path: '/api/auth/register' }
