import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext.ts'
import { ProtectedRoute } from './ProtectedRoute.tsx'

function LoginProbe() {
  const location = useLocation()
  return <p>login page {location.search}</p>
}

function renderAt(status: AuthStatus) {
  const auth: AuthContextValue = {
    status,
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser: vi.fn(),
  }
  const router = createMemoryRouter([
    { path: '/account', element: <ProtectedRoute><p>secret account</p></ProtectedRoute> },
    { path: '/login', element: <LoginProbe /> },
  ], { initialEntries: ['/account?tab=1'] })
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to /login with a return path', () => {
    renderAt('signed-out')
    expect(screen.queryByText('secret account')).not.toBeInTheDocument()
    expect(screen.getByText(`login page ?redirect=${encodeURIComponent('/account?tab=1')}`)).toBeInTheDocument()
  })

  it('renders the page for signed-in users', () => {
    renderAt('signed-in')
    expect(screen.getByText('secret account')).toBeInTheDocument()
  })

  it('waits while the session is being checked', () => {
    renderAt('loading')
    expect(screen.getByRole('status')).toHaveTextContent(/checking your session/i)
  })
})
