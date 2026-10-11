import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider.tsx'
import { AuthPage } from './AuthPage.tsx'

const fetchMock = vi.fn<typeof fetch>()

function reply(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
}

function renderPage(mode: 'login' | 'register', entry = `/${mode}`) {
  const router = createMemoryRouter([
    { path: '/login', element: <AuthPage mode="login" /> },
    { path: '/register', element: <AuthPage mode="register" /> },
    { path: '/MCP/roadmap', element: <p>roadmap page</p> },
    { path: '/', element: <p>home page</p> },
  ], { initialEntries: [entry] })
  render(<AuthProvider><RouterProvider router={router} /></AuthProvider>)
}

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
}

beforeEach(() => {
  fetchMock.mockReset()
  // AuthProvider asks who is signed in on mount.
  fetchMock.mockImplementation((input) => String(input) === '/api/auth/me' ? reply(401, { error: 'unauthorized' }) : reply(500, {}))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('AuthPage', () => {
  it('shows field errors and sends nothing for invalid register input', async () => {
    renderPage('register')
    fill('not-an-email', 'short')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(['/api/auth/me'])
  })

  it('signs in and returns to the page in ?redirect=', async () => {
    fetchMock.mockImplementation((input) => {
      if (String(input) === '/api/auth/login') return reply(200, { user: { id: 'u1', email: 'a@x.io', name: null } })
      return reply(401, { error: 'unauthorized' })
    })
    renderPage('login', `/login?redirect=${encodeURIComponent('/MCP/roadmap')}`)
    fill('A@X.io', 'correct horse')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('roadmap page')).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([input]) => String(input) === '/api/auth/login')!
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@x.io', password: 'correct horse' })
  })

  it('shows the server error for wrong credentials', async () => {
    fetchMock.mockImplementation((input) => String(input) === '/api/auth/login'
      ? reply(401, { error: 'Incorrect email or password' })
      : reply(401, { error: 'unauthorized' }))
    renderPage('login')
    fill('a@x.io', 'wrong password')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password'))
  })
})
