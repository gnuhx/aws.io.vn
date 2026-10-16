import { useCallback, useEffect, useState } from 'react'
import type { RoadmapId } from '../../../shared/roadmapProgress.ts'
import { ApiError } from '../../auth/api.ts'
import { useAuth } from '../../auth/authContext.ts'
import { useToast } from '../../components/Toast/toastContext.ts'
import { progressApi } from '../../progress/api.ts'

export type LessonReadState = ReturnType<typeof useLessonReadState>

/**
 * Which lessons of a roadmap the signed-in learner has read, loaded once for the whole topic page.
 * Signed-out visitors (or a topic without a roadmap) request nothing.
 */
export function useLessonReadState(roadmapId: RoadmapId | null) {
  const { status: authStatus, user, markSignedOut } = useAuth()
  const toast = useToast()
  // Results are tagged with the user they belong to, so a different account never sees stale state.
  const owner = authStatus === 'signed-in' && user && roadmapId ? user.id : null
  const [saved, setSaved] = useState<{ owner: string; read: ReadonlySet<string> } | null>(null)
  const [loadError, setLoadError] = useState<{ owner: string; message: string } | null>(null)
  const [reloads, setReloads] = useState(0)

  /** Shows the failure and returns its message; a 401 also switches the page to signed out. */
  const failed = useCallback((cause: unknown, fallback: string) => {
    const expired = cause instanceof ApiError && cause.status === 401
    if (expired) markSignedOut()
    const message = expired ? 'Your session expired. Sign in again to track lessons.' : fallback
    toast.error(message)
    return message
  }, [markSignedOut, toast])

  useEffect(() => {
    if (!owner || !roadmapId) return
    let active = true
    progressApi.list(roadmapId)
      .then((statuses) => {
        if (!active) return
        const read = Object.entries(statuses).filter(([, status]) => status === 'completed').map(([itemId]) => itemId)
        setSaved({ owner, read: new Set(read) })
      })
      .catch((cause: unknown) => { if (active) setLoadError({ owner, message: failed(cause, 'Could not load your lesson progress.') }) })
    return () => { active = false }
  }, [owner, roadmapId, reloads, failed])

  /** Saves the lessons as read; rejects with a user-facing message, leaving the shown state unchanged. */
  const markRead = useCallback(async (lessonIds: readonly string[]) => {
    if (!owner || !roadmapId) return
    try {
      await progressApi.markLessonsRead(roadmapId, lessonIds)
    } catch (cause) {
      throw new Error(failed(cause, 'Could not mark these lessons as read. Try again.'), { cause })
    }
    setSaved((current) => current?.owner === owner ? { owner, read: new Set([...current.read, ...lessonIds]) } : current)
  }, [owner, roadmapId, failed])

  return {
    authStatus,
    owner,
    /** Read lesson IDs, or null while loading (or after a failed load). */
    read: owner && saved?.owner === owner ? saved.read : null,
    loadError: owner && loadError?.owner === owner ? loadError.message : '',
    reload: () => { setLoadError(null); setReloads((count) => count + 1) },
    markRead,
  }
}
