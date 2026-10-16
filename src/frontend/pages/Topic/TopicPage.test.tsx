import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../../auth/authContext.ts'
import { getLessonCatalog } from '../../content.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import { TopicPage } from './TopicPage.tsx'

describe('TopicPage', () => {
  it('lists the published MCP lessons in module and lesson order', () => {
    renderRoute('/MCP')

    const expected = [...(getLessonCatalog().MCP ?? [])]
      .sort((left, right) => (left.module?.order ?? Infinity) - (right.module?.order ?? Infinity) || left.order - right.order)
      .map((lesson) => `/MCP/${lesson.slug}`)
    const links = screen.getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href) => href?.startsWith('/MCP/') && href !== '/MCP/roadmap')

    expect(screen.getByRole('heading', { name: 'Node.js MCP Server Learning Course' })).toBeInTheDocument()
    expect(links).toEqual(expected)
  })

  it('shows not found for a topic with no published lessons', () => {
    renderRoute('/nothing-yet')

    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeInTheDocument()
  })
})

// MCP Module 7 has three materials; only MCP:lesson-0007 and MCP:lesson-0008 are in the progress manifest.
const READ = 'MCP:lesson-0007'
const UNREAD = 'MCP:lesson-0008'
const ROADMAP_ITEM = 'MCP:item-0086'

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
const progressCalls = (method?: string) => fetchMock.mock.calls
  .filter(([input, init]) => String(input).startsWith('/api/progress/') && (!method || (init?.method ?? 'GET') === method))
const moduleSeven = () => screen.getByRole('heading', { name: 'Remote MCP, Auth & Deploy' }).closest('section')!

function renderTopic(status: AuthStatus, markSignedOut = vi.fn()) {
  const auth: AuthContextValue = {
    status,
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true, preferences: { resumeReading: false } } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut, updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{ path: '/:topic', element: <TopicPage /> }], { initialEntries: ['/MCP'] })
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

/** GET answers with `statuses`; POST answers with each of `posts` in turn (default: success). */
function serve(statuses: Record<string, string>, posts: number[] = []) {
  fetchMock.mockImplementation((_input, init) => {
    if (init?.method === 'POST') {
      const status = posts.shift() ?? 200
      return reply(status, status === 200 ? { status: 'completed' } : { error: 'boom' })
    }
    return reply(200, { statuses })
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('TopicPage module read action', () => {
  it('sends signed-out visitors to sign in without requesting progress; lessons stay navigable', () => {
    renderTopic('signed-out')

    expect(within(moduleSeven()).getByRole('link', { name: 'Sign in to track Module 7 lessons' }))
      .toHaveAttribute('href', `/login?redirect=${encodeURIComponent('/MCP')}`)
    expect(within(moduleSeven()).getAllByRole('link', { name: /Remote/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Mark all read/ })).not.toBeInTheDocument()
    expect(progressCalls()).toEqual([])
  })

  it('counts only tracked lessons and saves just the unread ones, leaving roadmap items alone', async () => {
    serve({ [READ]: 'completed', [ROADMAP_ITEM]: 'completed' })
    renderTopic('signed-in')
    const section = within(moduleSeven())

    expect(await section.findByText('1/2 read')).toBeInTheDocument()
    fireEvent.click(section.getByRole('button', { name: 'Mark all read in Module 7' }))

    expect(await section.findByText('All read ✓')).toBeInTheDocument()
    expect(section.getByText('2/2 read')).toBeInTheDocument()
    const posts = progressCalls('POST')
    expect(posts).toHaveLength(1)
    expect(posts[0][0]).toBe('/api/progress/MCP')
    expect(JSON.parse(String(posts[0][1]?.body))).toEqual({ lessonIds: [UNREAD] })
    expect(progressCalls('PUT')).toEqual([])
    expect(progressCalls('DELETE')).toEqual([])
  })

  it('shows an error without claiming success, then succeeds on retry', async () => {
    serve({}, [500])
    renderTopic('signed-in')
    const section = within(moduleSeven())

    fireEvent.click(await section.findByRole('button', { name: 'Mark all read in Module 7' }))
    expect(await section.findByRole('alert')).toHaveTextContent('Could not mark these lessons as read. Try again.')
    expect(section.getByText('0/2 read')).toBeInTheDocument()
    expect(section.queryByText('All read ✓')).not.toBeInTheDocument()

    fireEvent.click(section.getByRole('button', { name: 'Mark all read in Module 7' }))
    expect(await section.findByText('All read ✓')).toBeInTheDocument()
    expect(section.queryByRole('alert')).not.toBeInTheDocument()
    expect(progressCalls('POST').map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { lessonIds: [READ, UNREAD] },
      { lessonIds: [READ, UNREAD] },
    ])
  })

  it('restores the saved read count on reload', async () => {
    serve({ [READ]: 'completed', [UNREAD]: 'completed' })
    renderTopic('signed-in')
    const section = within(moduleSeven())

    expect(await section.findByText('2/2 read')).toBeInTheDocument()
    expect(section.getByText('All read ✓')).toBeInTheDocument()
    expect(section.queryByRole('button', { name: /Mark all read/ })).not.toBeInTheDocument()
  })

  it('signs the visitor out when the session expired', async () => {
    fetchMock.mockImplementation(() => reply(401, { error: 'unauthorized' }))
    const markSignedOut = vi.fn()
    renderTopic('signed-in', markSignedOut)

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session expired.')
    expect(markSignedOut).toHaveBeenCalled()
  })

  it('disables the action while loading and saving', async () => {
    let finishSave: (response: Response) => void = () => {}
    fetchMock.mockImplementation((_input, init) => init?.method === 'POST'
      ? new Promise<Response>((resolve) => { finishSave = resolve })
      : reply(200, { statuses: {} }))
    renderTopic('signed-in')
    const section = within(moduleSeven())

    expect(section.getByRole('button', { name: 'Mark all read in Module 7' })).toBeDisabled()
    const button = await section.findByRole('button', { name: 'Mark all read in Module 7' })
    expect(await section.findByText('0/2 read')).toBeInTheDocument()
    expect(button).toBeEnabled()
    expect(button).toHaveAttribute('type', 'button')

    fireEvent.click(button)
    const saving = await section.findByRole('button', { name: 'Saving… in Module 7' })
    expect(saving).toBeDisabled()
    expect(saving).toHaveAttribute('aria-busy', 'true')
    finishSave(new Response(JSON.stringify({ status: 'completed' }), { status: 200, headers: { 'content-type': 'application/json' } }))
    expect(await section.findByText('All read ✓')).toBeInTheDocument()
  })
})
