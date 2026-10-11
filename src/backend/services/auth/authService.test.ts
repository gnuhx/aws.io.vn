import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { InvalidGoogleTokenError, type GoogleIdentity } from '../../clients/google.ts'
import { DuplicateEmailError, type NewUser, type User, type UserRepository } from '../../repositories/users.ts'
import { createAuthService } from './authService.ts'

function memoryRepository() {
  const rows: User[] = []
  const repo: UserRepository = {
    findById: async (id) => rows.find((row) => row.id === id) ?? null,
    findByEmail: async (email) => rows.find((row) => row.email === email) ?? null,
    findByGoogleSub: async (sub) => rows.find((row) => row.googleSub === sub) ?? null,
    create: async (user: NewUser) => {
      if (rows.some((row) => row.email === user.email)) throw new DuplicateEmailError()
      const created = { ...user, id: String(rows.length + 1) }
      rows.push(created)
      return created
    },
    linkGoogle: async (id, { googleSub, name, clearPassword }) => {
      const row = rows.find((candidate) => candidate.id === id)
      if (!row) return null
      Object.assign(row, { googleSub, name, emailVerified: true }, clearPassword ? { passwordHash: null } : {})
      return row
    },
  }
  return { repo, rows }
}

const googleIdentity = (overrides: Partial<GoogleIdentity> = {}): GoogleIdentity => ({
  sub: 'google-sub-1', email: 'a@x.io', emailVerified: true, name: 'Ada', ...overrides,
})

describe('authService', () => {
  let rows: User[]
  let service: ReturnType<typeof createAuthService>
  let identity: GoogleIdentity

  beforeEach(() => {
    const memory = memoryRepository()
    rows = memory.rows
    identity = googleIdentity()
    service = createAuthService(memory.repo, async (credential) => {
      if (credential !== 'valid-token') throw new InvalidGoogleTokenError()
      return identity
    })
  })

  describe('register', () => {
    it('stores a bcrypt hash, never the plain password', async () => {
      const user = await service.register({ email: 'a@x.io', password: 'correct horse' })
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$12\$/)
      expect(user?.passwordHash).not.toContain('correct horse')
      expect(await bcrypt.compare('correct horse', user!.passwordHash!)).toBe(true)
      expect(user?.emailVerified).toBe(false)
    })

    it('refuses an email that is already registered', async () => {
      await service.register({ email: 'a@x.io', password: 'correct horse' })
      expect(await service.register({ email: 'a@x.io', password: 'another pass' })).toBeNull()
      expect(rows).toHaveLength(1)
    })
  })

  describe('login', () => {
    beforeEach(async () => { await service.register({ email: 'a@x.io', password: 'correct horse' }) })

    it('returns the user for the right password', async () => {
      expect((await service.login({ email: 'a@x.io', password: 'correct horse' }))?.email).toBe('a@x.io')
    })

    it('returns null for a wrong password or an unknown email', async () => {
      expect(await service.login({ email: 'a@x.io', password: 'wrong password' })).toBeNull()
      expect(await service.login({ email: 'nobody@x.io', password: 'correct horse' })).toBeNull()
    })

    it('returns null for a Google-only account', async () => {
      rows.push({ id: '9', email: 'g@x.io', name: null, passwordHash: null, googleSub: 's', emailVerified: true })
      expect(await service.login({ email: 'g@x.io', password: 'anything' })).toBeNull()
    })
  })

  describe('loginWithGoogle', () => {
    it('rejects a token the verifier refuses and creates nothing', async () => {
      expect(await service.loginWithGoogle('forged')).toEqual({ ok: false, reason: 'invalid_token' })
      expect(rows).toHaveLength(0)
    })

    it('creates a verified user on first sign-in and finds the same user by Google sub later', async () => {
      const first = await service.loginWithGoogle('valid-token')
      const second = await service.loginWithGoogle('valid-token')
      expect(first.ok && second.ok && first.user.id === second.user.id).toBe(true)
      expect(rows).toEqual([expect.objectContaining({ email: 'a@x.io', googleSub: 'google-sub-1', emailVerified: true, passwordHash: null })])
    })

    it('links Google to the existing password account with the same verified email', async () => {
      const registered = await service.register({ email: 'a@x.io', password: 'correct horse' })
      const result = await service.loginWithGoogle('valid-token')
      expect(result.ok && result.user.id).toBe(registered!.id)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ googleSub: 'google-sub-1', emailVerified: true })
    })

    it('drops the password of an unverified account when linking, so a squatter loses access', async () => {
      await service.register({ email: 'a@x.io', password: 'squatter pass' })
      await service.loginWithGoogle('valid-token')
      expect(rows[0].passwordHash).toBeNull()
      expect(await service.login({ email: 'a@x.io', password: 'squatter pass' })).toBeNull()
    })

    it('does not link or create when Google has not verified the email', async () => {
      await service.register({ email: 'a@x.io', password: 'correct horse' })
      identity = googleIdentity({ emailVerified: false })
      expect(await service.loginWithGoogle('valid-token')).toEqual({ ok: false, reason: 'email_unverified' })
      expect(rows).toHaveLength(1)
      expect(rows[0].googleSub).toBeNull()
    })
  })
})
