import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import type { RoadmapId } from '../../../shared/roadmapProgress.ts'
import { ApiError } from '../../auth/api.ts'
import { useAuth } from '../../auth/authContext.ts'
import { progressApi } from '../../progress/api.ts'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useToast } from '../../components/Toast/toastContext.ts'
import styles from './LessonPage.module.css'

/**
 * Explicit read/unread toggle for one lesson. Opening a lesson never marks it read.
 * Signed-out visitors see a sign-in prompt; the lesson itself stays readable.
 */
export function LessonReadControl({ roadmapId, lessonId }: { roadmapId: RoadmapId; lessonId: string }) {
  const { status: authStatus, user, markSignedOut } = useAuth()
  const location = useLocation()
  const toast = useToast()
  // Results are tagged with the user they belong to, so a different account never sees stale state.
  const owner = authStatus === 'signed-in' && user ? user.id : null
  const [saved, setSaved] = useState<{ owner: string; read: boolean } | null>(null)
  const [error, setError] = useState<{ owner: string | null; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [reloads, setReloads] = useState(0)

  const failed = useCallback((cause: unknown, fallback: string) => {
    const expired = cause instanceof ApiError && cause.status === 401
    if (expired) markSignedOut()
    const message = expired ? 'Your session expired. Sign in again to track lessons.' : fallback
    setError({ owner, message })
    toast.error(message)
  }, [owner, markSignedOut, toast])

  useEffect(() => {
    if (!owner) return
    let active = true
    progressApi.list(roadmapId)
      .then((statuses) => { if (active) setSaved({ owner, read: statuses[lessonId] === 'completed' }) })
      .catch((cause: unknown) => { if (active) failed(cause, 'Could not load whether you have read this lesson.') })
    return () => { active = false }
  }, [owner, roadmapId, lessonId, reloads, failed])

  if (authStatus === 'loading') return null

  if (!owner) {
    return (
      <section className={styles.readControl} aria-label="Lesson progress">
        <p className={styles.readStatus}>Sign in to mark lessons as read and pick up where you left off on any device.</p>
        <Link className={styles.readButton} to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
          Sign in to track lessons
        </Link>
      </section>
    )
  }

  const loaded = saved?.owner === owner
  const read = loaded && saved.read
  const currentError = error?.owner === owner ? error.message : ''

  const toggle = async () => {
    setSaving(true)
    setError(null)
    try {
      await progressApi.save(roadmapId, lessonId, read ? 'not_started' : 'completed')
      setSaved({ owner, read: !read })
      toast.success(read ? 'Lesson marked as unread.' : 'Lesson marked as read ✓')
    } catch (cause) {
      failed(cause, 'Could not save this change. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.readControl} aria-label="Lesson progress">
      <p className={styles.readStatus} role="status">
        {!loaded ? <>{!currentError && <Spinner />} Loading your progress…</> : read ? 'Read ✓ — this lesson is marked as read.' : 'Not marked as read yet.'}
      </p>
      <button
        type="button"
        className={styles.readButton}
        disabled={!loaded || saving}
        onClick={() => { void toggle() }}
      >
        {saving && <Spinner />}{saving ? 'Saving…' : read ? 'Mark as unread' : 'Mark as read'}
      </button>
      {currentError && (
        <p className={styles.readError} role="alert">
          {currentError}
          {!loaded && <button type="button" onClick={() => { setError(null); setReloads((count) => count + 1) }}>Retry</button>}
        </p>
      )}
    </section>
  )
}
