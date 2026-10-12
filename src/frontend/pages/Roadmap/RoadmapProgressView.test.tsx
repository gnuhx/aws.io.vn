import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../../auth/authContext.ts'
import { ToastProvider } from '../../components/Toast/ToastProvider.tsx'
import { getCourseRoadmap, getTrackedLessons } from '../../content.ts'
import { RoadmapProgressView } from './RoadmapProgressView.tsx'

const lessons = getTrackedLessons('aws-saa-c03')
// aws-saa-c03:lesson-0001 (VPC networking overview) is shown on roadmap item 3.1 (aws-saa-c03:item-0081).
const vpc = lessons.find((lesson) => lesson.id === 'aws-saa-c03:lesson-0001')!

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

function renderRoadmap(status: AuthStatus) {
  const auth: AuthContextValue = {
    status,
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{
    path: '/aws-saa-c03/roadmap',
    element: <RoadmapProgressView roadmapId="aws-saa-c03" markdown={getCourseRoadmap('aws-saa-c03')} lessons={lessons} />,
  }], { initialEntries: ['/aws-saa-c03/roadmap'] })
  render(<ToastProvider><AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider></ToastProvider>)
}

const statusSelects = () => screen.getAllByRole('combobox', { name: /^Progress status for item/ })
const vpcRoadmapItem = () => screen.getByRole('link', { name: `Lesson: ${vpc.title}` }).closest('li')!

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('RoadmapProgressView lessons', () => {
  it('lets signed-out visitors browse lessons from the roadmap without loading progress', () => {
    renderRoadmap('signed-out')

    // Every manifest item gets a (disabled) status control; none is left as a bare checkbox.
    expect(statusSelects()).toHaveLength(305)
    expect(statusSelects().every((select) => (select as HTMLSelectElement).disabled)).toBe(true)
    expect(screen.queryByLabelText('This roadmap item needs a progress ID')).not.toBeInTheDocument()
    expect(vpcRoadmapItem()).toHaveTextContent('3.1')
    expect(within(vpcRoadmapItem()).getByRole('link', { name: `Lesson: ${vpc.title}` })).toHaveAttribute('href', vpc.href)
    expect(within(vpcRoadmapItem()).queryByText(/Read ✓|Unread/)).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows read state on the roadmap item and counts lessons apart from roadmap items', async () => {
    fetchMock.mockImplementation(() => reply(200, {
      statuses: { [vpc.id]: 'completed', 'aws-saa-c03:item-0002': 'in_progress' },
    }))
    renderRoadmap('signed-in')

    expect(await within(vpcRoadmapItem()).findByText('Read ✓')).toBeInTheDocument()
    expect(within(vpcRoadmapItem()).getByRole('combobox')).toHaveValue('not_started')
    expect(screen.getByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0002' })).toHaveValue('in_progress')
    // A read lesson does not complete any roadmap item.
    expect(screen.getByRole('heading', { name: '0 of 305 complete' })).toBeInTheDocument()
    expect(screen.getByText(`1 in progress · 1 of ${lessons.length} lessons read`)).toBeInTheDocument()
    // Continue still targets the in-progress roadmap item, not a lesson.
    expect(screen.getByRole('link', { name: 'Continue learning →' })).toHaveAttribute('href', '#roadmap-item-aws-saa-c03-item-0002')
  })

  it('shows unread lessons as unread', async () => {
    fetchMock.mockImplementation(() => reply(200, { statuses: {} }))
    renderRoadmap('signed-in')

    expect(await within(vpcRoadmapItem()).findByText('Unread')).toBeInTheDocument()
  })
})

// Routes the two progress endpoints the roadmap calls.
function replyWith(statuses: Record<string, string>, activity: unknown[] = []) {
  fetchMock.mockImplementation((input) =>
    String(input).endsWith('/activity') ? reply(200, { activity }) : reply(200, { statuses }))
}

describe('RoadmapProgressView chart, filters and calendar', () => {
  const statuses = { 'aws-saa-c03:item-0001': 'completed', 'aws-saa-c03:item-0002': 'in_progress' }

  it('colors each status select by its value', async () => {
    replyWith(statuses)
    renderRoadmap('signed-in')

    const inProgress = await screen.findByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0002' })
    expect(inProgress.className).toMatch(/statusInProgress/)
    expect(screen.getByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0001' }).className).toMatch(/statusCompleted/)
    expect(screen.getByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0003' }).className).toMatch(/statusNotStarted/)
  })

  it('shows a donut of item statuses', async () => {
    replyWith(statuses)
    renderRoadmap('signed-in')

    expect(await screen.findByRole('img', { name: '1 completed, 1 in progress, 303 not started' })).toBeInTheDocument()
  })

  it('filters roadmap items by status', async () => {
    replyWith(statuses)
    renderRoadmap('signed-in')

    fireEvent.click(await screen.findByRole('radio', { name: 'In progress' }))
    expect(statusSelects()).toHaveLength(1)
    expect(statusSelects()[0]).toHaveValue('in_progress')
    expect(screen.getByText('1 of 305 items shown')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(statusSelects()).toHaveLength(305)
  })

  it('filters roadmap items to those with unread lessons', async () => {
    replyWith({ [vpc.id]: 'completed' })
    renderRoadmap('signed-in')
    await screen.findByRole('radio', { name: 'All' })

    fireEvent.change(screen.getByRole('combobox', { name: 'Lessons' }), { target: { value: 'has_lesson' } })
    const withLessons = statusSelects().length
    expect(withLessons).toBeGreaterThan(1)
    expect(vpcRoadmapItem()).toBeVisible()

    fireEvent.change(screen.getByRole('combobox', { name: 'Lessons' }), { target: { value: 'unread_lesson' } })
    expect(statusSelects().length).toBeLessThan(withLessons)
    expect(screen.queryByRole('link', { name: `Lesson: ${vpc.title}` })).not.toBeInTheDocument()
  })

  it('shows learning history from the activity log', async () => {
    const now = new Date()
    replyWith(statuses, [
      { itemId: 'aws-saa-c03:item-0001', status: 'completed', at: now.toISOString() },
      { itemId: 'aws-saa-c03:item-0002', status: 'in_progress', at: now.toISOString() },
    ])
    renderRoadmap('signed-in')

    expect(await screen.findByText('You studied today. Keep the streak going!')).toBeInTheDocument()
    const calendar = screen.getByRole('region', { name: 'Learning history' })
    expect(within(calendar).getByText('Current streak').nextSibling).toHaveTextContent('1 day')
    expect(fetchMock).toHaveBeenCalledWith('/api/progress/aws-saa-c03/activity', expect.anything())
  })

  it('shows a spinner on the item while saving, then a saved toast', async () => {
    replyWith(statuses)
    renderRoadmap('signed-in')
    const select = await screen.findByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0003' })

    let finishSave: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { finishSave = resolve }))
    fireEvent.change(select, { target: { value: 'completed' } })

    expect(within(select.closest('li')!).getByRole('status')).toHaveTextContent('Saving…')
    expect(select).toBeDisabled()

    finishSave(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
    expect(await screen.findByText('Progress saved: Completed.')).toBeInTheDocument()
    expect(within(select.closest('li')!).queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows an error toast when saving fails', async () => {
    replyWith(statuses)
    renderRoadmap('signed-in')
    const select = await screen.findByRole('combobox', { name: 'Progress status for item aws-saa-c03:item-0003' })

    fetchMock.mockImplementationOnce(() => reply(500, { error: 'boom' }))
    fireEvent.change(select, { target: { value: 'completed' } })

    expect(await screen.findByRole('status', { name: 'Notifications' })).toHaveTextContent('Could not save this progress update.')
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save this progress update.')
  })

  it('shows no chart, calendar or status filter when signed out', () => {
    renderRoadmap('signed-out')

    expect(screen.queryByRole('region', { name: 'Learning history' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'In progress' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Lessons' }), { target: { value: 'has_lesson' } })
    expect(vpcRoadmapItem()).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
