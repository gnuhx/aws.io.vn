import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { loginSchema } from '../../shared/schemas/auth.ts'
import { json, publicEndpoint, readJson } from '../middleware/http.ts'
import { signedInResponse } from '../middleware/session.ts'
import { authService } from '../services/auth/index.ts'

export default publicEndpoint(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  const parsed = loginSchema.safeParse(await readJson(request))
  if (!parsed.success) return json({ error: 'invalid input', fields: z.flattenError(parsed.error).fieldErrors }, 400)

  const user = await authService.login(parsed.data)
  // Same answer for unknown email and wrong password, so the endpoint can't be used to probe accounts.
  if (!user) return json({ error: 'Incorrect email or password' }, 401)
  return signedInResponse(user)
})

export const config: Config = { path: '/api/auth/login' }
