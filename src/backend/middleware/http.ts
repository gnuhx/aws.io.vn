import type { Context } from '@netlify/functions'
import { allowedOrigins, authEnv, ConfigError } from '../env.ts'
import { readSessionCookie, verifySessionToken } from '../services/auth/sessions.ts'

export type Handler = (request: Request, context: Context) => Promise<Response>
export type Auth = { userId: string }
export type AuthedHandler = (request: Request, context: Context, auth: Auth) => Promise<Response>

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const response = Response.json(body, { status, headers })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export function readJson(request: Request) {
  return request.json().catch(() => null) as Promise<unknown>
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// An Origin is trusted when it is this site itself or listed in ALLOWED_ORIGINS.
function isTrustedOrigin(origin: string, request: Request) {
  return origin === new URL(request.url).origin || allowedOrigins().includes(origin)
}

function applyCors(request: Request, response: Response) {
  const origin = request.headers.get('origin')
  if (origin && allowedOrigins().includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.append('Vary', 'Origin')
  return response
}

/**
 * Shared wrapper for every endpoint: CORS, CSRF checks, and error → status mapping.
 * State-changing requests must be JSON and, when the browser sends an Origin, come from a trusted one.
 * Together with SameSite=Lax this stops other sites from using a learner's session cookie.
 */
function withHttp(handler: Handler): Handler {
  return async (request, context) => {
    if (request.method === 'OPTIONS') {
      const response = new Response(null, { status: 204 })
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      return applyCors(request, response)
    }

    if (!SAFE_METHODS.has(request.method)) {
      const origin = request.headers.get('origin')
      if (origin && !isTrustedOrigin(origin, request)) return applyCors(request, json({ error: 'forbidden origin' }, 403))
      if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
        return applyCors(request, json({ error: 'expected application/json' }, 415))
      }
    }

    let response: Response
    try {
      response = await handler(request, context)
    } catch (cause) {
      if (cause instanceof ConfigError) {
        console.error(cause.message)
        response = json({ error: 'service is not configured' }, 503)
      } else {
        console.error('Request failed', cause)
        response = json({ error: 'request failed' }, 500)
      }
    }
    return applyCors(request, response)
  }
}

/** Marks an endpoint as reachable without a session (D-007: every endpoint is public or withAuth). */
export const publicEndpoint = (handler: Handler) => withHttp(handler)

/** Rejects the request with 401 unless it carries a valid session cookie. */
export function withAuth(handler: AuthedHandler) {
  return withHttp(async (request, context) => {
    const token = readSessionCookie(request)
    if (!token) return json({ error: 'unauthorized' }, 401)
    const userId = await verifySessionToken(token, authEnv().JWT_SECRET)
    if (!userId) return json({ error: 'unauthorized' }, 401)
    return handler(request, context, { userId })
  })
}
