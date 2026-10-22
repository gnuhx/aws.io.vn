import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useToast } from '../../components/Toast/toastContext.ts'
import type { LessonReadState } from './useLessonReadState.ts'
import styles from './TopicPage.module.css'

/**
 * Read count and "mark all read" for one module's trackable lessons (materials without a tracking ID are not passed in).
 * Only marks lessons read; it never touches roadmap checklist items.
 */
export function ModuleReadAction({ moduleName, lessonIds, state }: { moduleName: string; lessonIds: readonly string[]; state: LessonReadState }) {
  const location = useLocation()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!lessonIds.length || state.authStatus === 'loading') return null

  if (!state.owner) {
    return (
      <div className={styles.moduleRead}>
        <Link className={styles.moduleReadButton} to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
          Sign in to track{' '}<span className={styles.visuallyHidden}>{moduleName} lessons</span>
        </Link>
      </div>
    )
  }

  const unread = state.read ? lessonIds.filter((lessonId) => !state.read?.has(lessonId)) : []
  const readCount = lessonIds.length - unread.length

  const markAll = async () => {
    setSaving(true)
    setError('')
    try {
      await state.markRead(unread)
      toast.success(`${moduleName}: ${unread.length === 1 ? '1 lesson' : `${unread.length} lessons`} marked as read ✓`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not mark these lessons as read. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.moduleRead}>
      <span className={styles.moduleReadCount} role="status">
        {state.read ? `${readCount}/${lessonIds.length} read` : state.loadError ? '' : <><Spinner /><span className={styles.visuallyHidden}>Loading progress</span></>}
        {state.read && <>{' '}<span className={styles.visuallyHidden}>in {moduleName}</span></>}
      </span>
      {state.read && unread.length === 0 ? (
        <span className={styles.moduleReadDone}>All read ✓</span>
      ) : (
        <button
          type="button"
          className={styles.moduleReadButton}
          disabled={!state.read || saving}
          aria-busy={saving}
          onClick={() => { void markAll() }}
        >
          {saving && <Spinner />}{saving ? 'Saving…' : 'Mark all read'}{' '}<span className={styles.visuallyHidden}>in {moduleName}</span>
        </button>
      )}
      {error && <p className={styles.moduleReadError} role="alert">{error}</p>}
    </div>
  )
}
