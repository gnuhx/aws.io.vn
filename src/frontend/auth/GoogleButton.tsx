import { GoogleLogin } from '@react-oauth/google'
import { googleClientId } from './config.ts'

/** "Continue with Google". Renders nothing when VITE_GOOGLE_CLIENT_ID isn't set. */
export function GoogleButton({ onCredential, onError }: { onCredential: (credential: string) => void; onError: () => void }) {
  if (!googleClientId) return null
  return (
    <GoogleLogin
      text="continue_with"
      width="360"
      onSuccess={(response) => (response.credential ? onCredential(response.credential) : onError())}
      onError={onError}
    />
  )
}
