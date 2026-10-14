import type { Config } from '@netlify/functions'
import { z } from 'zod'
import { changePasswordSchema } from '../../shared/schemas/profile.ts'
import { json, readJson, withAuth } from '../middleware/http.ts'
import { signedOutResponse } from '../middleware/session.ts'
import { authService } from '../services/auth/index.ts'

const FAILURES = {
  current_required: { currentPassword: ['Enter your current password'] },
  wrong_password: { currentPassword: ['Current password is incorrect'] },
  same_password: { newPassword: ['Choose a password different from your current one'] },
} as const

export default withAuth(async (request, _context, { userId }) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  const parsed = changePasswordSchema.safeParse(await readJson(request))
  if (!parsed.success) return json({ error: 'Check the highlighted fields', fields: z.flattenError(parsed.error).fieldErrors }, 400)

  const result = await authService.changePassword(userId, parsed.data)
  if (result.ok) return json({ ok: true })
  if (result.reason === 'not_found') return signedOutResponse({ error: 'unauthorized' }, 401)
  return json({ error: 'Check the highlighted fields', fields: FAILURES[result.reason] }, 400)
})

export const config: Config = { path: '/api/profile/password' }
