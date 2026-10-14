import { jwtVerify, SignJWT } from 'jose'

export const SESSION_COOKIE = 'session'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

const key = (secret: string) => new TextEncoder().encode(secret)

export function createSessionToken(userId: string, secret: string) {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key(secret))
}

/** Returns the user id, or null for a missing, tampered or expired token. */
export async function verifySessionToken(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null
  } catch {
    return null
  }
}

// Secure stays on in development: browsers accept Secure cookies on http://localhost.
const cookieAttributes = 'Path=/; HttpOnly; Secure; SameSite=Lax'

export const sessionCookie = (token: string) => `${SESSION_COOKIE}=${token}; ${cookieAttributes}; Max-Age=${SESSION_TTL_SECONDS}`
export const clearedSessionCookie = () => `${SESSION_COOKIE}=; ${cookieAttributes}; Max-Age=0`

export function readSessionCookie(request: Request) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === SESSION_COOKIE) return value.join('=') || null
  }
  return null
}
