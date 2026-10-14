import { act, render, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicUser } from '../../shared/schemas/auth.ts'
import { AuthContext, type AuthContextValue } from '../auth/authContext.ts'
import { SAVE_DEBOUNCE_MS, useResumeReading } from './useResumeReading.ts'

const fetchMock = vi.fn<typeof fetch>()
const reply = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }))

// jsdom has no IntersectionObserver: record instances so tests can fire them.
const observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; disconnect: ReturnType<typeof vi.fn> }[] = []
class FakeIntersectionObserver {
  disconnect = vi.fn()
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    observers.push({ callback, options, disconnect: this.disconnect })
  }
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
}

const scrollIntoView = vi.fn()

function Lesson() {
  const ref = useRef<HTMLElement>(null)
  useResumeReading({ topic: 'aws-saa-c03', lessonSlug: 'vpc', containerRef: ref, contentReady: true })
  return <article ref={ref}><h2 id="intro">Intro</h2><h2 id="subnets">Subnets</h2><h2 id="routing">Routing</h2></article>
}

function renderLesson({ resumeReading = true, entry = '/aws-saa-c03/vpc' } = {}) {
  const user: PublicUser = { id: 'u1', email: 'a@x.io', name: null, avatarUrl: null, hasPassword: true, preferences: { resumeReading } }
  const auth: AuthContextValue = {
    status: 'signed-in', user,
    register: vi.fn(), login: vi.fn(), loginWithGoogle: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), updateUser: vi.fn(),
  }
  const router = createMemoryRouter([{ path: '/:topic/:slug', element: <Lesson /> }], { initialEntries: [entry] })
  return render(<AuthContext.Provider value={auth}><RouterProvider router={router} /></AuthContext.Provider>)
}

/** Places headings: everything listed at or above `y` (px from viewport top), the rest far below. */
function placeHeadings(tops: Record<string, number>) {
  for (const heading of document.querySelectorAll<HTMLElement>('h2')) {
    heading.getBoundingClientRect = () => ({ top: tops[heading.id] ?? 5000 }) as DOMRect
  }
}

const savedBody = (position: unknown) => ({ position })
const puts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')

beforeEach(() => {
  observers.length = 0
  fetchMock.mockReset()
  scrollIntoView.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  Element.prototype.scrollIntoView = scrollIntoView
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useResumeReading', () => {
  it('does nothing at all when the setting is off', async () => {
    renderLesson({ resumeReading: false })
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
    expect(observers).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('restores the saved section of this lesson with a smooth scroll', async () => {
    fetchMock.mockImplementation(() => reply(savedBody({ lessonSlug: 'vpc', sectionId: 'subnets', updatedAt: 'x' })))
    renderLesson()

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }))
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('subnets'))
    expect(fetchMock).toHaveBeenCalledWith('/api/reading/aws-saa-c03', expect.objectContaining({ credentials: 'same-origin' }))
    await waitFor(() => expect(observers).toHaveLength(1))
    expect(observers[0].options?.rootMargin).toBe('0px 0px -70% 0px')
  })

  it('jumps without animation when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    fetchMock.mockImplementation(() => reply(savedBody({ lessonSlug: 'vpc', sectionId: 'routing', updatedAt: 'x' })))
    renderLesson()

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }))
  })

  it('lets a #hash win over saved progress: no fetch, no scroll', async () => {
    renderLesson({ entry: '/aws-saa-c03/vpc#routing' })

    await waitFor(() => expect(observers).toHaveLength(1))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it.each([
    ['another lesson', { lessonSlug: 'ec2', sectionId: 'subnets', updatedAt: 'x' }],
    ['a section that no longer exists', { lessonSlug: 'vpc', sectionId: 'removed', updatedAt: 'x' }],
    ['nothing saved', null],
  ])('opens normally when the saved position is for %s', async (_label, position) => {
    fetchMock.mockImplementation(() => reply(savedBody(position)))
    renderLesson()

    await waitFor(() => expect(observers).toHaveLength(1))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('saves the section being read once scrolling settles, and only once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchMock.mockImplementation((_input, init) => reply(init?.method === 'PUT' ? { saved: true } : savedBody(null)))
    renderLesson()
    await waitFor(() => expect(observers).toHaveLength(1))
    const fire = () => act(() => observers[0].callback([], {} as IntersectionObserver))

    placeHeadings({ intro: -400, subnets: 50 })
    fire()
    placeHeadings({ intro: -900, subnets: -400, routing: 100 })
    fire()
    expect(puts()).toHaveLength(0)

    await act(async () => { await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS) })
    expect(puts()).toHaveLength(1)
    expect(JSON.parse(String(puts()[0][1]?.body))).toEqual({ lessonSlug: 'vpc', sectionId: 'routing' })

    fire() // Same section again: nothing new to save.
    await act(async () => { await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS) })
    expect(puts()).toHaveLength(1)
  })

  it('flushes the pending section with sendBeacon when the page is hidden', async () => {
    const sendBeacon = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })
    fetchMock.mockImplementation(() => reply(savedBody(null)))
    renderLesson()
    await waitFor(() => expect(observers).toHaveLength(1))

    placeHeadings({ intro: -400, subnets: 50 })
    act(() => observers[0].callback([], {} as IntersectionObserver))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const [url, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob]
    expect(url).toBe('/api/reading/aws-saa-c03')
    expect(blob.type).toBe('application/json')
    expect(JSON.parse(await blob.text())).toEqual({ lessonSlug: 'vpc', sectionId: 'subnets' })
    expect(puts()).toHaveLength(0)
  })

  it('disconnects and flushes when leaving the lesson', async () => {
    fetchMock.mockImplementation((_input, init) => reply(init?.method === 'PUT' ? { saved: true } : savedBody(null)))
    const { unmount } = renderLesson()
    await waitFor(() => expect(observers).toHaveLength(1))

    placeHeadings({ intro: 10 })
    act(() => observers[0].callback([], {} as IntersectionObserver))
    unmount()

    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(puts()).toHaveLength(1)
    expect(puts()[0][1]).toMatchObject({ keepalive: true })
  })
})
