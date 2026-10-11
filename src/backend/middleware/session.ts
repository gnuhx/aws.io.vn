import { authEnv } from '../env.ts'
import { toPublicUser } from '../services/auth/index.ts'
import { clearedSessionCookie, createSessionToken, sessionCookie } from '../services/auth/sessions.ts'
import type { User } from '../repositories/users.ts'
import { json } from './http.ts'

/** Responds with the public user and sets a fresh session cookie for them. */
export async function signedInResponse(user: User, status = 200) {
  const token = await createSessionToken(user.id, authEnv().JWT_SECRET)
  return json({ user: toPublicUser(user) }, status, { 'Set-Cookie': sessionCookie(token) })
}

export const signedOutResponse = (body: unknown = {}, status = 200) =>
  json(body, status, { 'Set-Cookie': clearedSessionCookie() })
