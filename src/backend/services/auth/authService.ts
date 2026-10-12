import bcrypt from 'bcryptjs'
import type { LoginInput, PublicUser, RegisterInput } from '../../../shared/schemas/auth.ts'
import type { ChangePasswordInput, Profile, ProfileUpdateInput } from '../../../shared/schemas/profile.ts'
import { InvalidGoogleTokenError, type GoogleIdentity } from '../../clients/google.ts'
import { DuplicateEmailError, type User, type UserRepository } from '../../repositories/users.ts'

const BCRYPT_COST = 12
// Compared against when the email is unknown, so "no such user" takes as long as "wrong password".
const DUMMY_HASH = '$2b$12$wiIBjCsVEsNHYE5w5TXNtenivIT04SAi8eT3hCgJcIDE6r7mIWK3C'

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  hasPassword: user.passwordHash !== null,
})

export const toProfile = (user: User): Profile => ({ hobbies: user.hobbies, techStack: user.techStack, bio: user.bio })

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'current_required' | 'wrong_password' | 'same_password' }

export type GoogleLoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid_token' | 'email_unverified' }

export type GoogleTokenVerifier = (credential: string) => Promise<GoogleIdentity>

export function createAuthService(users: UserRepository, verifyGoogleToken: GoogleTokenVerifier) {
  return {
    findUser: (id: string) => users.findById(id),

    /** Returns null when the email is already registered. */
    async register({ email, password }: RegisterInput): Promise<User | null> {
      if (await users.findByEmail(email)) return null
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
      try {
        return await users.create({ email, passwordHash, name: null, googleSub: null, emailVerified: false, avatarUrl: null })
      } catch (cause) {
        // Lost a race with a concurrent registration of the same email.
        if (cause instanceof DuplicateEmailError) return null
        throw cause
      }
    },

    /** Returns null for an unknown email, a wrong password, or a Google-only account. */
    async login({ email, password }: LoginInput): Promise<User | null> {
      const user = await users.findByEmail(email)
      const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
      return user?.passwordHash && matches ? user : null
    },

    /** The user is resolved only from the verified token's claims, never from anything else in the request. */
    async loginWithGoogle(credential: string): Promise<GoogleLoginResult> {
      let identity: GoogleIdentity
      try {
        identity = await verifyGoogleToken(credential)
      } catch (cause) {
        if (cause instanceof InvalidGoogleTokenError) return { ok: false, reason: 'invalid_token' }
        throw cause
      }

      const known = await users.findByGoogleSub(identity.sub)
      if (known) {
        // Google photos change; keep ours in step on every Google sign-in.
        if (identity.picture && identity.picture !== known.avatarUrl) {
          await users.setAvatar(known.id, identity.picture)
          return { ok: true, user: { ...known, avatarUrl: identity.picture } }
        }
        return { ok: true, user: known }
      }

      // Linking or creating by email is only safe when Google vouches for that email.
      if (!identity.emailVerified) return { ok: false, reason: 'email_unverified' }

      const existing = await users.findByEmail(identity.email)
      if (existing) {
        // Nobody proved ownership of an unverified password account: whoever set that password
        // may not own the email, so the password stops working once the real owner links Google.
        const linked = await users.linkGoogle(existing.id, {
          googleSub: identity.sub,
          name: existing.name ?? identity.name,
          avatarUrl: identity.picture,
          clearPassword: !existing.emailVerified,
        })
        if (linked) return { ok: true, user: linked }
      }

      const user = await users.create({
        email: identity.email,
        name: identity.name,
        passwordHash: null,
        googleSub: identity.sub,
        emailVerified: true,
        avatarUrl: identity.picture,
      })
      return { ok: true, user }
    },

    /** Input is already normalized by profileUpdateSchema. Returns null when the user no longer exists. */
    updateProfile: (userId: string, input: ProfileUpdateInput) => users.updateProfile(userId, input),

    /**
     * Accounts with a password must prove they know it. Google-only accounts (no hash) may set a first password:
     * their session already came from a Google-verified sign-in.
     */
    async changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordInput): Promise<ChangePasswordResult> {
      const user = await users.findById(userId)
      if (!user) return { ok: false, reason: 'not_found' }
      if (user.passwordHash) {
        if (!currentPassword) return { ok: false, reason: 'current_required' }
        if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return { ok: false, reason: 'wrong_password' }
        if (currentPassword === newPassword) return { ok: false, reason: 'same_password' }
      }
      await users.setPasswordHash(user.id, await bcrypt.hash(newPassword, BCRYPT_COST))
      return { ok: true }
    },
  }
}
