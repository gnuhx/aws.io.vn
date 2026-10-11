import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicUser } from '../../shared/schemas/auth.ts'
import { authApi } from './api.ts'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const signIn = useCallback((next: PublicUser) => {
    setUser(next)
    setStatus('signed-in')
  }, [])

  const markSignedOut = useCallback(() => {
    setUser(null)
    setStatus('signed-out')
  }, [])

  // The cookie is httpOnly, so asking the server is the only way to know who is signed in.
  useEffect(() => {
    let active = true
    authApi.me()
      .then((me) => { if (active) signIn(me) })
      .catch(() => { if (active) markSignedOut() })
    return () => { active = false }
  }, [markSignedOut, signIn])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    register: async (input) => signIn(await authApi.register(input)),
    login: async (input) => signIn(await authApi.login(input)),
    loginWithGoogle: async (credential) => signIn(await authApi.google(credential)),
    logout: async () => {
      try {
        await authApi.logout()
      } finally {
        markSignedOut()
      }
    },
    markSignedOut,
  }), [markSignedOut, signIn, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
