import { createContext, useContext } from 'react'
import type { LoginInput, PublicUser, RegisterInput } from '../../shared/schemas/auth.ts'

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out'

export type AuthContextValue = {
  user: PublicUser | null
  status: AuthStatus
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
  /** Call after an API reports 401 so the UI shows the signed-out state. */
  markSignedOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
