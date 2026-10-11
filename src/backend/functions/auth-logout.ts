import type { Config } from '@netlify/functions'
import { json, publicEndpoint } from '../middleware/http.ts'
import { signedOutResponse } from '../middleware/session.ts'

// Public so an expired session can still be cleared. The JWT is stateless: clearing the cookie is the logout.
export default publicEndpoint(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  return signedOutResponse()
})

export const config: Config = { path: '/api/auth/logout' }
