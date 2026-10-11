import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { ClerkProvider } from '@clerk/react'
import { router } from './router.tsx'
import './styles/global.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publishableKey
      ? <ClerkProvider publishableKey={publishableKey}><RouterProvider router={router} /></ClerkProvider>
      : <RouterProvider router={router} />}
  </StrictMode>,
)
