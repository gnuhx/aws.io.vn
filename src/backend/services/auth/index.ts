import { verifyGoogleIdToken } from '../../clients/google.ts'
import { authEnv } from '../../env.ts'
import { mongoUserRepository } from '../../repositories/users.ts'
import { createAuthService } from './authService.ts'

export { toProfile, toPublicUser } from './authService.ts'

export const authService = createAuthService(mongoUserRepository, (credential) =>
  verifyGoogleIdToken(credential, authEnv().GOOGLE_CLIENT_ID),
)
