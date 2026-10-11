import { useAuth } from '@clerk/react'
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react'
import type { Components } from 'react-markdown'
import type { Element } from 'hast'
import { Link } from 'react-router'
import { roadmapProgressManifest, type ProgressStatus, type RoadmapId } from '../../../shared/roadmapProgress.ts'
import { MarkdownView } from '../../components/Markdown/MarkdownView.tsx'
import styles from './RoadmapProgressView.module.css'

type SavedStatuses = Record<string, ProgressStatus>
type ProgressResponse = { statuses: SavedStatuses }
const itemAnchorId = (itemId: string) => `roadmap-item-${itemId.replace(/[^a-zA-Z0-9_-]/g, '-')}`

function StatusControl({
  roadmapId,
  itemId,
  status,
  disabled,
  onChange,
}: {
  roadmapId: RoadmapId
  itemId: string
  status: ProgressStatus | 'not_started'
  disabled: boolean
  onChange: (itemId: string, status: ProgressStatus | 'not_started') => void
}) {
  return (
    <select
      id={itemAnchorId(itemId)}
      className={styles.statusSelect}
      aria-label={`Progress status for item ${itemId}`}
      value={status}
      disabled={disabled}
      onChange={(event) => onChange(itemId, event.currentTarget.value as ProgressStatus | 'not_started')}
      data-roadmap={roadmapId}
    >
      <option value="not_started">Not started</option>
      <option value="in_progress">In progress</option>
      <option value="completed">Completed</option>
    </select>
  )
}

export function RoadmapProgressView({ roadmapId, markdown }: { roadmapId: RoadmapId; markdown: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [statuses, setStatuses] = useState<SavedStatuses>({})
  const [loading, setLoading] = useState(true)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [error, setError] = useState('')
  const items = roadmapProgressManifest[roadmapId]
  const itemsBySourceLine = useMemo(() => new Map(items.map((item) => [item.sourceLine, item])), [items])

  const fetchProgress = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setStatuses({})
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const response = await fetch(`/api/progress/${encodeURIComponent(roadmapId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in again to load progress.' : 'Could not load saved progress.')
      const result = await response.json() as ProgressResponse
      setStatuses(result.statuses ?? {})
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load saved progress.')
    } finally {
      setLoading(false)
    }
  }, [getToken, isLoaded, isSignedIn, roadmapId])

  useEffect(() => { void fetchProgress() }, [fetchProgress])

  const updateStatus = useCallback(async (itemId: string, status: ProgressStatus | 'not_started') => {
    if (!isSignedIn || savingItem) return
    setSavingItem(itemId)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Your session expired. Sign in again to save progress.')
      const method = status === 'not_started' ? 'DELETE' : 'PUT'
      const response = await fetch(`/api/progress/${encodeURIComponent(roadmapId)}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(status === 'not_started' ? { itemId } : { itemId, status }),
      })
      if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in again to save progress.' : 'Could not save this progress update.')
      setStatuses((previous) => {
        const next = { ...previous }
        if (status === 'not_started') delete next[itemId]
        else next[itemId] = status
        return next
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this progress update.')
    } finally {
      setSavingItem(null)
    }
  }, [getToken, isSignedIn, roadmapId, savingItem])

  const modules = useMemo(() => {
    const grouped = new Map<string, typeof items>()
    for (const item of items) {
      const group = grouped.get(item.moduleId) ?? []
      group.push(item)
      grouped.set(item.moduleId, group)
    }
    return [...grouped.entries()].sort(([left], [right]) => {
      if (left === 'course') return 1
      if (right === 'course') return -1
      return Number(left.slice(7)) - Number(right.slice(7))
    })
  }, [items])

  const completedCount = items.filter((item) => statuses[item.id] === 'completed').length
  const inProgressCount = items.filter((item) => statuses[item.id] === 'in_progress').length
  const nextItem = items.find((item) => statuses[item.id] === 'in_progress') ?? items.find((item) => statuses[item.id] !== 'completed')

  const components: Components = {
    input: ({ node, ...props }: ComponentProps<'input'> & { node?: Element }) => {
      if (props.type !== 'checkbox') return <input {...props} />
      const sourceLine = node?.position?.start.line
      const item = sourceLine ? itemsBySourceLine.get(sourceLine) : undefined
      if (!item) return <input {...props} disabled aria-label="This roadmap item needs a progress ID" />
      const status = statuses[item.id] ?? 'not_started'
      return (
        <StatusControl
          roadmapId={roadmapId}
          itemId={item.id}
          status={status}
          disabled={!isSignedIn || loading || savingItem !== null}
          onChange={(id, value) => { void updateStatus(id, value) }}
        />
      )
    },
  }

  return (
    <div className={styles.progressView}>
      <section className={styles.summary} aria-label="Roadmap progress summary">
        <div className={styles.summaryHeading}>
          <div>
            <p className={styles.label}>Your roadmap progress</p>
            <h2>{isSignedIn ? `${completedCount} of ${items.length} complete` : 'Read the roadmap without signing in'}</h2>
            <p>{isSignedIn ? `${inProgressCount} in progress` : 'Sign in to save progress and continue later.'}</p>
          </div>
          {!isSignedIn && <Link className={styles.signInLink} to="/sign-in">Sign in to track progress</Link>}
          {isSignedIn && nextItem && <a className={styles.continueLink} href={`#${itemAnchorId(nextItem.id)}`}>Continue learning →</a>}
          {isSignedIn && !nextItem && <span className={styles.doneMessage}>Roadmap complete ✓</span>}
        </div>
        {isSignedIn && <div className={styles.moduleProgress}>
          {modules.map(([moduleId, moduleItems]) => {
            const done = moduleItems.filter((item) => statuses[item.id] === 'completed').length
            const label = moduleId === 'course' ? 'Course items' : `Module ${moduleId.slice(7)}`
            return <div className={styles.moduleRow} key={moduleId}><span>{label}</span><span>{done}/{moduleItems.length} complete</span></div>
          })}
        </div>}
        {error && <p className={styles.error} role="alert">{error} <button type="button" onClick={() => { void fetchProgress() }}>Retry</button></p>}
      </section>
      <div className={styles.roadmapArticle}>
        <MarkdownView markdown={markdown} components={components} />
      </div>
      {loading && <p className={styles.loading} role="status">Loading saved progress…</p>}
    </div>
  )
}
