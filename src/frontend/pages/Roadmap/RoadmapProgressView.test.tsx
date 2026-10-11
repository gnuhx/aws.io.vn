import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthStatus } from '../../auth/authContext.ts'
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
    user: status === 'signed-in' ? { id: 'u1', email: 'a@x.io', name: null } : null,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(),
  }
  const router = createMemoryRouter([{
    path: '/aws-saa-c03/roadmap',
    element: <RoadmapProgressView roadmapId="aws-saa-c03" markdown={getCourseRoadmap('aws-saa-c03')} lessons={lessons} />,
  }], { initialEntries: ['/aws-saa-c03/roadmap'] })
  render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

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
    expect(screen.getAllByRole('combobox')).toHaveLength(305)
    expect(screen.getAllByRole('combobox').every((select) => (select as HTMLSelectElement).disabled)).toBe(true)
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
