import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router'
import type { ReadingPositionInput } from '../../shared/schemas/reading.ts'
import { useAuth } from '../auth/authContext.ts'
import { readingApi } from './api.ts'

/** How long the reader must stay on a section before it is saved; fast scrolling only saves where it stops. */
export const SAVE_DEBOUNCE_MS = 1500
/** Layout counts as settled after this long without the article changing size. */
const LAYOUT_QUIET_MS = 300
/** Never wait longer than this for images / layout before restoring. */
const LAYOUT_MAX_WAIT_MS = 3000
/** A heading is "being read" once it is in the top 30% of the viewport. */
const READING_LINE = 0.3
const HEADING_SELECTOR = 'h1[id], h2[id], h3[id], h4[id]'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Resolves once images inside the container have loaded (or failed) and the container has stopped changing size,
 * so scrolling to a heading isn't undone by content above it growing afterwards.
 */
function waitForStableLayout(container: HTMLElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    let quiet: ReturnType<typeof setTimeout> | undefined
    let observer: ResizeObserver | undefined
    const done = () => {
      clearTimeout(quiet)
      clearTimeout(cap)
      observer?.disconnect()
      signal.removeEventListener('abort', done)
      resolve()
    }
    const cap = setTimeout(done, LAYOUT_MAX_WAIT_MS)
    signal.addEventListener('abort', done)

    const pending = [...container.querySelectorAll('img')].filter((img) => !img.complete)
    const images = Promise.all(pending.map((img) => new Promise((settle) => {
      img.addEventListener('load', settle, { once: true })
      img.addEventListener('error', settle, { once: true })
    })))

    void images.then(() => {
      if (signal.aborted) return
      if (typeof ResizeObserver === 'undefined') return done()
      // ResizeObserver reports once right away, then on every change: each report restarts the quiet timer.
      observer = new ResizeObserver(() => {
        clearTimeout(quiet)
        quiet = setTimeout(done, LAYOUT_QUIET_MS)
      })
      observer.observe(container)
    })
  })
}

/** Page is being hidden or unloaded: a normal fetch may be cancelled, a beacon is queued by the browser. */
function sendOnExit(topic: string, position: ReadingPositionInput) {
  const body = JSON.stringify(position)
  try {
    // Same-origin, JSON Blob: passes the API's JSON + Origin CSRF checks like any other request.
    if (navigator.sendBeacon?.(readingApi.url(topic), new Blob([body], { type: 'application/json' }))) return
  } catch {
    // Some browsers refuse non-form beacon bodies; keepalive fetch below does the same job.
  }
  void readingApi.save(topic, position, { keepalive: true }).catch(() => {})
}

/**
 * "Resume where I left off" for one lesson. Does nothing at all (no observers, no requests) unless the signed-in
 * user turned the setting on. When on: restores the course's saved section if it belongs to this lesson and the
 * URL has no #hash, then tracks the section being read and saves it (debounced, flushed when the page is hidden).
 */
export function useResumeReading({
  topic,
  lessonSlug,
  containerRef,
  contentReady,
}: {
  topic: string
  lessonSlug: string
  containerRef: RefObject<HTMLElement | null>
  contentReady: boolean
}) {
  const { status, user } = useAuth()
  const enabled = status === 'signed-in' && Boolean(user?.preferences.resumeReading)
  // The hash the lesson was opened with. Later in-page anchor clicks must not restart restore/tracking.
  const { hash } = useLocation()
  const openedWithHash = useRef(hash !== '')
  // Read by the effect cleanup: layout effects run before passive cleanups, so this already holds the new value
  // when the cleanup runs because the setting was just turned off.
  const enabledRef = useRef(enabled)
  useLayoutEffect(() => { enabledRef.current = enabled })

  useEffect(() => {
    if (!enabled || !contentReady) return
    const container = containerRef.current
    if (!container) return

    const abort = new AbortController()
    let observer: IntersectionObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let pending: string | null = null
    let lastSaved: string | null = null

    const flush = (exiting: boolean) => {
      clearTimeout(timer)
      if (!pending || pending === lastSaved) return
      const position = { lessonSlug, sectionId: pending }
      lastSaved = pending
      pending = null
      if (exiting) sendOnExit(topic, position)
      else void readingApi.save(topic, position).catch(() => {}) // Background save: a miss only costs one position.
    }

    const track = () => {
      const headings = [...container.querySelectorAll<HTMLElement>(HEADING_SELECTOR)]
      if (!headings.length) return
      // The bottom margin shrinks the observed area to the top 30% of the viewport, so the observer fires exactly
      // when a heading crosses that reading line (in either direction) and stays quiet the rest of the time.
      observer = new IntersectionObserver(() => {
        const line = window.innerHeight * READING_LINE
        let current: string | null = null
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top > line) break
          current = heading.id
        }
        if (!current || current === (pending ?? lastSaved)) return
        pending = current
        clearTimeout(timer)
        timer = setTimeout(() => flush(false), SAVE_DEBOUNCE_MS)
      }, { rootMargin: `0px 0px -${(1 - READING_LINE) * 100}% 0px` })
      for (const heading of headings) observer.observe(heading)
    }

    const restore = async () => {
      // An explicit #hash in the URL is what the reader asked for: never override it with a saved position.
      if (openedWithHash.current) return
      const position = await readingApi.get(topic).catch(() => null)
      if (abort.signal.aborted || position?.lessonSlug !== lessonSlug) return
      await waitForStableLayout(container, abort.signal)
      if (abort.signal.aborted) return
      const target = document.getElementById(position.sectionId)
      // The section may have been renamed or removed since: then the lesson simply opens at the top.
      if (!target || !container.contains(target)) return
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
      lastSaved = position.sectionId
    }

    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(true) }
    const onPageHide = () => flush(true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    // Tracking starts after restore so that headings passed by the restore scroll don't count as reading.
    void restore().then(() => { if (!abort.signal.aborted) track() })

    return () => {
      abort.abort()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      // Leaving the lesson (SPA navigation): keep the latest position. Turned off or signed out: send nothing.
      if (enabledRef.current) flush(true)
    }
  }, [enabled, contentReady, containerRef, topic, lessonSlug])
}
