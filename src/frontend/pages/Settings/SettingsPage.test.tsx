import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicUser } from '../../../shared/schemas/auth.ts'
import { AuthContext, type AuthContextValue } from '../../auth/authContext.ts'
import { ToastProvider } from '../../components/Toast/ToastProvider.tsx'
import { SettingsPage } from './SettingsPage.tsx'

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

const user: PublicUser = { id: 'u1', email: 'ada@x.io', name: 'Ada', avatarUrl: null, hasPassword: true }
const profile = { hobbies: ['Chess'], techStack: ['AWS'], bio: 'Learning SAA-C03.' }

function renderSettings(account: PublicUser = user) {
  const updateUser = vi.fn()
  const auth: AuthContextValue = {
    status: 'signed-in', user: account,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser,
  }
  const router = createMemoryRouter([{ path: '/settings', element: <SettingsPage /> }], { initialEntries: ['/settings'] })
  render(<ToastProvider><AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider></ToastProvider>)
  return { updateUser }
}

const notifications = () => screen.getByRole('status', { name: 'Notifications' })
const callsTo = (path: string) => fetchMock.mock.calls.filter(([input]) => String(input) === path)

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('SettingsPage', () => {
  it('loads the profile and saves edits, updating the header user', async () => {
    fetchMock.mockImplementation((_input, init) => init?.method === 'PUT'
      ? reply(200, { user: { ...user, name: 'Ada L.' }, profile: { ...profile, techStack: ['AWS', 'React'] } })
      : reply(200, { user, profile }))
    const { updateUser } = renderSettings()

    const name = await screen.findByLabelText('Display name')
    expect(name).toHaveValue('Ada')
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()

    fireEvent.change(name, { target: { value: 'Ada L.' } })
    const tech = screen.getByLabelText('Tech stack')
    fireEvent.change(tech, { target: { value: 'React' } })
    fireEvent.keyDown(tech, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => expect(notifications()).toHaveTextContent('Profile saved.'))
    const [, init] = callsTo('/api/profile').find(([, request]) => request?.method === 'PUT')!
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Ada L.', hobbies: ['Chess'], techStack: ['AWS', 'React'], bio: 'Learning SAA-C03.' })
    expect(updateUser).toHaveBeenCalledWith({ ...user, name: 'Ada L.' })
  })

  it('shows the server field error for a wrong current password', async () => {
    fetchMock.mockImplementation((input) => String(input) === '/api/profile/password'
      ? reply(400, { error: 'Check the highlighted fields', fields: { currentPassword: ['Current password is incorrect'] } })
      : reply(200, { user, profile }))
    renderSettings()

    fireEvent.change(await screen.findByLabelText('Current password'), { target: { value: 'wrong pass' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'battery staple' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'battery staple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument()
    expect(notifications()).toHaveTextContent('Check the highlighted fields')
  })

  it('checks the confirmation locally before sending anything', async () => {
    fetchMock.mockImplementation(() => reply(200, { user, profile }))
    renderSettings()

    fireEvent.change(await screen.findByLabelText('Current password'), { target: { value: 'old pass!' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'battery staple' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different one' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Passwords don’t match')).toBeInTheDocument()
    expect(callsTo('/api/profile/password')).toHaveLength(0)
  })

  it('lets a Google-only account set a password without the current one', async () => {
    const googleUser = { ...user, hasPassword: false, avatarUrl: 'https://lh3.googleusercontent.com/a/x' }
    fetchMock.mockImplementation((input) => String(input) === '/api/profile/password'
      ? reply(200, { ok: true })
      : reply(200, { user: googleUser, profile }))
    renderSettings(googleUser)

    const section = await screen.findByRole('region', { name: 'Set a password' })
    expect(within(section).queryByLabelText('Current password')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Public profile' }).querySelector('img')).toHaveAttribute('src', googleUser.avatarUrl)

    fireEvent.change(within(section).getByLabelText('New password'), { target: { value: 'battery staple' } })
    fireEvent.change(within(section).getByLabelText('Confirm new password'), { target: { value: 'battery staple' } })
    fireEvent.click(within(section).getByRole('button', { name: 'Set password' }))

    await waitFor(() => expect(notifications()).toHaveTextContent('Password set.'))
    expect(JSON.parse(String(callsTo('/api/profile/password')[0][1]?.body))).toEqual({ newPassword: 'battery staple' })
  })
})
