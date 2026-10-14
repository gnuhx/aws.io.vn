import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/authContext.ts'
import { getLessonCatalog } from '../content.ts'
import { ContinueReading } from './ContinueReading.tsx'

const fetchMock = vi.fn<typeof fetch>()
const lessons = getLessonCatalog()['aws-saa-c03']
const lesson = lessons[0]

function renderContinue(resumeReading: boolean) {
  const auth: AuthContextValue = {
    status: 'signed-in',
    user: { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true, preferences: { resumeReading } },
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{ path: '/', element: <ContinueReading topic="aws-saa-c03" lessons={lessons} /> }])
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('ContinueReading', () => {
  it('links to the last lesson read in the course, without a hash', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ position: { lessonSlug: lesson.slug, sectionId: 'x', updatedAt: 'y' } })))
    renderContinue(true)

    expect(await screen.findByRole('link', { name: /continue reading/i })).toHaveAttribute('href', `/aws-saa-c03/${lesson.slug}`)
  })

  it('requests nothing and renders nothing when the setting is off', () => {
    renderContinue(false)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
