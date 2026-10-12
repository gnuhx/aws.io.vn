import { z } from 'zod'

// Used by the Login/Register forms and by the auth functions, so both sides reject the same input.

// bcrypt only hashes the first 72 bytes, so longer passwords would be silently truncated.
const BCRYPT_MAX_BYTES = 72

export const emailSchema = z
  .string({ error: 'Enter your email address' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }).max(254, { error: 'Email address is too long' }))

export const newPasswordSchema = z
  .string({ error: 'Enter a password' })
  .min(8, { error: 'Use at least 8 characters' })
  .refine((value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES, {
    error: `Use at most ${BCRYPT_MAX_BYTES} characters`,
  })

export const registerSchema = z.object({ email: emailSchema, password: newPasswordSchema }).strict()

// Login does not re-check password rules: a wrong password is a 401, not a validation error.
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string({ error: 'Enter your password' }).min(1, { error: 'Enter your password' }).max(1024),
  })
  .strict()

// Not strict: anything sent next to the credential is dropped, never trusted.
export const googleLoginSchema = z.object({ credential: z.string().min(1).max(4096) })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type PublicUser = {
  id: string
  email: string
  name: string | null
  /** Google profile photo (https), or null: the UI then shows initials. */
  avatarUrl: string | null
  /** False for Google-only accounts, which may set a first password without a current one. */
  hasPassword: boolean
}
