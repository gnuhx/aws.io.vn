import { describe, expect, it } from 'vitest'
import { googleLoginSchema, loginSchema, registerSchema } from './auth.ts'

describe('auth schemas', () => {
  it('normalises email to trimmed lower case', () => {
    expect(registerSchema.parse({ email: '  A@X.io ', password: '12345678' }).email).toBe('a@x.io')
  })

  it.each([
    ['bad email', { email: 'not-an-email', password: '12345678' }],
    ['short password', { email: 'a@x.io', password: '1234567' }],
    ['73-byte password', { email: 'a@x.io', password: 'x'.repeat(73) }],
    ['multi-byte password over 72 bytes', { email: 'a@x.io', password: 'é'.repeat(37) }],
    ['missing fields', {}],
    ['unknown fields', { email: 'a@x.io', password: '12345678', role: 'admin' }],
    ['not an object', null],
  ])('register rejects %s', (_label, input) => {
    expect(registerSchema.safeParse(input).success).toBe(false)
  })

  it('accepts a 72-byte password', () => {
    expect(registerSchema.safeParse({ email: 'a@x.io', password: 'x'.repeat(72) }).success).toBe(true)
  })

  it('login only requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@x.io', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'a@x.io', password: '' }).success).toBe(false)
  })

  it('google login keeps only the credential', () => {
    expect(googleLoginSchema.parse({ credential: 'tok', email: 'victim@x.io', userId: '1' })).toEqual({ credential: 'tok' })
  })
})
