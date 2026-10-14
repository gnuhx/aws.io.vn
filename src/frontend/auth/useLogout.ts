import { useState } from 'react'
import { useToast } from '../components/Toast/toastContext.ts'
import { useAuth } from './authContext.ts'

/** Sign out with a busy flag for the button and a toast for the outcome. */
export function useLogout() {
  const { logout } = useAuth()
  const toast = useToast()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
      toast.success('Signed out.')
    } catch {
      // AuthProvider already cleared the local session; the server cookie may live until it expires.
      toast.error('Signed out on this device, but the server could not be reached.')
    } finally {
      setSigningOut(false)
    }
  }

  return { signOut, signingOut }
}
