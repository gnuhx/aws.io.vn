import {
  createWorkspaceSchema,
  loginSchema,
  registerSchema,
  toFieldErrors,
  type CreateWorkspaceInput,
  type FieldErrorMap,
  type LoginInput,
  type RegisterInput,
} from '@nexus/shared'

/** Kết quả API: thành công, hoặc lỗi theo field / lỗi chung cả form */
export type ApiResult<TData, TInput> =
  | { ok: true; data: TData }
  | { ok: false; fieldErrors?: FieldErrorMap<TInput>; formError?: string }

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// "Database" giả trong bộ nhớ
const takenEmails = new Set(['an@nexus.vn'])
const takenSlugs = new Set(['acme', 'phin', 'lotus'])

/**
 * Giả lập POST /api/register (server thật làm ở M9).
 * Server KHÔNG tin client: parse lại bằng CÙNG schema từ @nexus/shared.
 */
export async function registerUser(
  payload: unknown,
): Promise<ApiResult<{ id: string; name: string }, RegisterInput>> {
  await delay(800)
  const parsed = registerSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) }

  const { name, email } = parsed.data
  if (email === 'loi@nexus.vn') {
    return { ok: false, formError: 'Máy chủ đang bận. Thử lại sau ít phút.' }
  }
  if (takenEmails.has(email)) {
    return { ok: false, fieldErrors: { email: 'Email này đã có tài khoản. Hãy đăng nhập.' } }
  }
  takenEmails.add(email)
  return { ok: true, data: { id: crypto.randomUUID(), name } }
}

/** Giả lập POST /api/workspaces */
export async function createWorkspace(
  payload: unknown,
): Promise<ApiResult<{ id: string; name: string }, CreateWorkspaceInput>> {
  await delay(700)
  const parsed = createWorkspaceSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) }

  const { name, slug } = parsed.data
  if (takenSlugs.has(slug)) {
    return { ok: false, fieldErrors: { slug: `Đường dẫn “${slug}” đã có workspace khác dùng` } }
  }
  takenSlugs.add(slug)
  return { ok: true, data: { id: slug, name } }
}

/** Giả lập POST /api/login. Sai mật khẩu → một câu chung, KHÔNG nói email có tồn tại hay không. */
export async function loginUser(payload: unknown): Promise<ApiResult<{ name: string }, LoginInput>> {
  await delay(600)
  const parsed = loginSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) }
  if (parsed.data.password === 'sai') {
    return { ok: false, formError: 'Email hoặc mật khẩu không đúng.' }
  }
  return { ok: true, data: { name: parsed.data.email === 'an@nexus.vn' ? 'Nguyễn An' : 'Ngọc Anh' } }
}
