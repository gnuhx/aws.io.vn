import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../../auth/authContext.ts'
import { findLesson } from '../../content.ts'
import { LessonPage } from './LessonPage.tsx'

// aws-saa-c03/02-vpc-networking.md: a Markdown lesson with tracking ID aws-saa-c03:lesson-0001.
const LESSON_PATH = '/aws-saa-c03/module-3-vpc-networking'
const LESSON_ID = 'aws-saa-c03:lesson-0001'
// The page title (the Markdown body may repeat it as its own heading).
const lessonTitle = () => screen.getAllByRole('heading', { level: 1, name: findLesson('aws-saa-c03', 'module-3-vpc-networking')!.title })[0]

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
const progressCalls = () => fetchMock.mock.calls.filter(([input]) => String(input).startsWith('/api/progress/'))

function renderLesson(status: AuthStatus, path = LESSON_PATH, markSignedOut = vi.fn()) {
  const auth: AuthContextValue = {
    status,
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true, preferences: { resumeReading: false } } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut, updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{ path: '/:topic/:slug', element: <LessonPage /> }], { initialEntries: [path] })
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('LessonPage read tracking', () => {
  it('lets signed-out visitors read the lesson and prompts them to sign in to track it', () => {
    renderLesson('signed-out')

    expect(lessonTitle()).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in to track lessons' }))
      .toHaveAttribute('href', `/login?redirect=${encodeURIComponent(LESSON_PATH)}`)
    expect(screen.queryByRole('button', { name: /mark as/i })).not.toBeInTheDocument()
    expect(progressCalls()).toEqual([])
  })

  it('opening a lesson only reads progress; it never marks the lesson read', async () => {
    fetchMock.mockImplementation(() => reply(200, { statuses: {} }))
    renderLesson('signed-in')

    expect(await screen.findByRole('button', { name: 'Mark as read' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Not marked as read yet.')
    expect(progressCalls().map(([, init]) => init?.method ?? 'GET')).toEqual(['GET'])
  })

  it('marks the lesson read and then unread with the lesson ID only', async () => {
    fetchMock.mockImplementation((_input, init) => {
      if (init?.method === 'PUT') return reply(200, { itemId: LESSON_ID, status: 'completed' })
      if (init?.method === 'DELETE') return reply(200, { itemId: LESSON_ID, status: 'not_started' })
      return reply(200, { statuses: { 'aws-saa-c03:item-0081': 'in_progress' } })
    })
    renderLesson('signed-in')

    fireEvent.click(await screen.findByRole('button', { name: 'Mark as read' }))
    expect(await screen.findByRole('button', { name: 'Mark as unread' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Read ✓/)

    fireEvent.click(screen.getByRole('button', { name: 'Mark as unread' }))
    expect(await screen.findByRole('button', { name: 'Mark as read' })).toBeInTheDocument()

    const writes = progressCalls().filter(([, init]) => init?.method)
    expect(writes.map(([input, init]) => [String(input), init?.method, JSON.parse(String(init?.body))])).toEqual([
      ['/api/progress/aws-saa-c03', 'PUT', { itemId: LESSON_ID, status: 'completed' }],
      ['/api/progress/aws-saa-c03', 'DELETE', { itemId: LESSON_ID }],
    ])
  })

  it('shows a saved read state after reload', async () => {
    fetchMock.mockImplementation(() => reply(200, { statuses: { [LESSON_ID]: 'completed' } }))
    renderLesson('signed-in')

    expect(await screen.findByRole('button', { name: 'Mark as unread' })).toBeInTheDocument()
  })

  it('treats a 401 as signed out and keeps the lesson readable', async () => {
    const markSignedOut = vi.fn()
    fetchMock.mockImplementation(() => reply(401, { error: 'unauthorized' }))
    renderLesson('signed-in', LESSON_PATH, markSignedOut)

    await waitFor(() => expect(markSignedOut).toHaveBeenCalled())
    expect(lessonTitle()).toBeInTheDocument()
  })

  it('shows no read control for lessons outside a roadmap', () => {
    renderLesson('signed-in', '/reactjs/does-not-matter')
    expect(screen.queryByRole('region', { name: 'Lesson progress' })).not.toBeInTheDocument()
    expect(progressCalls()).toEqual([])
  })
})

describe('LessonPage layout', () => {
  const stubWidth = (compact: boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: compact && query === '(max-width: 1024px)', addEventListener: vi.fn(), removeEventListener: vi.fn() }))

  it('collapses the module lesson list on phones and tablets so the article comes first', () => {
    stubWidth(true)
    renderLesson('signed-out')

    const summary = screen.getByText(/^Lessons in this module \(\d+\)$/)
    const details = summary.closest('details')!
    expect(details).not.toHaveAttribute('open')
    expect(details).toContainElement(screen.getByRole('link', { current: 'page' }))
  })

  it('keeps the plain sidebar list on wide screens', () => {
    stubWidth(false)
    renderLesson('signed-out')

    expect(screen.queryByText(/in this module/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { current: 'page' }).closest('details')).toBeNull()
  })
})
