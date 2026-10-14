import type { LoginInput, PublicUser, RegisterInput } from '../../shared/schemas/auth.ts'

export class ApiError extends Error {
  readonly status: number
  readonly fields: Record<string, string[] | undefined>

  constructor(status: number, message: string, fields: Record<string, string[] | undefined> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

type ErrorBody = { error?: string; fields?: Record<string, string[] | undefined> }

// Same-origin requests send the httpOnly session cookie automatically; JS never sees the token.
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json' } : init.headers,
  })
  const body = (await response.json().catch(() => ({}))) as T & ErrorBody
  if (!response.ok) throw new ApiError(response.status, body.error ?? 'Something went wrong. Try again.', body.fields)
  return body
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const authApi = {
  me: () => request<{ user: PublicUser }>('/api/auth/me').then((body) => body.user),
  register: (input: RegisterInput) => post<{ user: PublicUser }>('/api/auth/register', input).then((body) => body.user),
  login: (input: LoginInput) => post<{ user: PublicUser }>('/api/auth/login', input).then((body) => body.user),
  google: (credential: string) => post<{ user: PublicUser }>('/api/auth/google', { credential }).then((body) => body.user),
  logout: () => post<unknown>('/api/auth/logout', {}),
}
