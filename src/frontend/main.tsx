import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { googleClientId } from './auth/config.ts'
import { router } from './router.tsx'
import './styles/global.css'

const app = <AuthProvider><RouterProvider router={router} /></AuthProvider>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>,
)
