import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../../auth/authContext.ts'
import { HomePage } from './HomePage.tsx'

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

function renderHome(status: AuthStatus) {
  const auth: AuthContextValue = {
    status,
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true, preferences: { resumeReading: false } } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{ path: '/', element: <HomePage /> }])
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

const awsCard = () => screen.getByRole('link', { name: /aws saa-c03/i })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('HomePage', () => {
  it('shows the available learning topics and a sign-in hint when signed out', () => {
    renderHome('signed-out')

    expect(screen.getByRole('heading', { name: /engineering learning paths/i })).toBeInTheDocument()
    expect(within(awsCard()).getByText('305 roadmap items · sign in to track progress')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a progress ring per roadmap topic when signed in', async () => {
    fetchMock.mockImplementation((input) => String(input).includes('aws-saa-c03')
      ? reply(200, { statuses: { 'aws-saa-c03:item-0001': 'completed', 'aws-saa-c03:item-0002': 'in_progress' } })
      : reply(200, { statuses: {} }))
    renderHome('signed-in')

    expect(await within(awsCard()).findByRole('img', { name: '1 completed, 1 in progress, 303 not started' })).toBeInTheDocument()
    expect(within(awsCard()).getByText('1 of 305 items complete')).toBeInTheDocument()
    expect(within(awsCard()).getByText('0%')).toBeInTheDocument()
  })

  it('keeps the card usable when progress fails to load', async () => {
    fetchMock.mockImplementation(() => reply(500, {}))
    renderHome('signed-in')

    expect(await within(awsCard()).findByText('Couldn’t load progress right now.')).toBeInTheDocument()
    expect(awsCard()).toHaveAttribute('href', '/aws-saa-c03')
  })
})
