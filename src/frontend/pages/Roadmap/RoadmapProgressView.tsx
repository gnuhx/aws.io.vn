import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState, type ComponentProps } from 'react'
import type { Components } from 'react-markdown'
import type { Element } from 'hast'
import { Link, useLocation } from 'react-router'
import { ApiError } from '../../auth/api.ts'
import { useAuth } from '../../auth/authContext.ts'
import type { TrackedLesson } from '../../content.ts'
import { progressApi, type ActivityEvent, type SavedStatuses } from '../../progress/api.ts'
import { roadmapProgressManifest, type ProgressStatus, type RoadmapId, type RoadmapProgressItem } from '../../../shared/roadmapProgress.ts'
import { MarkdownView } from '../../components/Markdown/MarkdownView.tsx'
import { LearningCalendar } from './LearningCalendar.tsx'
import { ProgressDonut } from './ProgressDonut.tsx'
import styles from './RoadmapProgressView.module.css'

type ItemStatus = ProgressStatus | 'not_started'
type StatusFilter = 'all' | ItemStatus
type LessonFilter = 'all' | 'has_lesson' | 'unread_lesson'

const STATUS_CLASSES: Record<ItemStatus, string> = {
  not_started: styles.statusNotStarted,
  in_progress: styles.statusInProgress,
  completed: styles.statusCompleted,
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

function matchesFilters(
  status: ItemStatus,
  lessons: readonly TrackedLesson[] | undefined,
  statuses: SavedStatuses,
  statusFilter: StatusFilter,
  lessonFilter: LessonFilter,
) {
  if (statusFilter !== 'all' && status !== statusFilter) return false
  if (lessonFilter === 'has_lesson') return Boolean(lessons?.length)
  if (lessonFilter === 'unread_lesson') return Boolean(lessons?.some((lesson) => statuses[lesson.id] !== 'completed'))
  return true
}

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
      className={`${styles.statusSelect} ${STATUS_CLASSES[status]}`}
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

type RoadmapItemState = {
  roadmapId: RoadmapId
  itemsBySourceLine: Map<number, RoadmapProgressItem>
  lessonsByItem: Map<string, TrackedLesson[]>
  statuses: SavedStatuses
  loaded: boolean
  saving: boolean
  statusFilter: StatusFilter
  lessonFilter: LessonFilter
  updateStatus: (itemId: string, status: ProgressStatus | 'not_started') => void
}

const RoadmapItemContext = createContext<RoadmapItemState | null>(null)

// remark-gfm's task-list checkbox has no source position, so items are matched on their <li>, whose line is
// the manifest's sourceLine; the <li> then swaps its checkbox for the status control.
function RoadmapListItem({ node, children, ...props }: ComponentProps<'li'> & { node?: Element }) {
  const state = useContext(RoadmapItemContext)
  const sourceLine = node?.position?.start.line
  const item = state && sourceLine ? state.itemsBySourceLine.get(sourceLine) : undefined
  if (!state || !item) return <li {...props}>{children}</li>
  const content = Children.toArray(children).filter((child) => !(isValidElement<{ type?: string }>(child) && child.props.type === 'checkbox'))
  const status = state.statuses[item.id] ?? 'not_started'
  const lessons = state.lessonsByItem.get(item.id)
  return (
    <li {...props} data-status={status} hidden={!matchesFilters(status, lessons, state.statuses, state.statusFilter, state.lessonFilter)}>
      <StatusControl
        roadmapId={state.roadmapId}
        itemId={item.id}
        status={status}
        disabled={!state.loaded || state.saving}
        onChange={state.updateStatus}
      />
      {content}
      {lessons?.map((lesson) => {
        const read = state.statuses[lesson.id] === 'completed'
        return (
          <span className={styles.lessonBadge} key={lesson.id}>
            <Link to={lesson.href}>Lesson: {lesson.title}</Link>
            {state.loaded && <span className={read ? styles.lessonRead : styles.lessonUnread}>{read ? 'Read ✓' : 'Unread'}</span>}
          </span>
        )
      })}
    </li>
  )
}

// Stable component identities: progress changes re-render items through context instead of remounting
// the whole roadmap (which would also drop keyboard focus from the select that was just changed).
const roadmapComponents: Components = {
  input: ({ node, ...props }: ComponentProps<'input'> & { node?: Element }) =>
    node?.properties.type === 'checkbox' ? <input {...props} disabled aria-label="This roadmap item needs a progress ID" /> : <input {...props} />,
  li: RoadmapListItem,
}

/**
 * Roadmap items carry not_started / in_progress / completed. Published lessons are tracked separately as read
 * (a `completed` record under the lesson's ID): they are shown next to the roadmap item they cover and counted
 * on their own, so item completion counts and the continue target only ever look at roadmap items.
 */
export function RoadmapProgressView({ roadmapId, markdown, lessons = [] }: { roadmapId: RoadmapId; markdown: string; lessons?: TrackedLesson[] }) {
  const { status: authStatus, user, markSignedOut } = useAuth()
  const isSignedIn = authStatus === 'signed-in'
  const location = useLocation()
  // Loaded statuses are tagged with their owner, so nothing from another account (or signed out) is ever shown.
  const owner = isSignedIn && user ? user.id : null
  const [saved, setSaved] = useState<{ owner: string; statuses: SavedStatuses } | null>(null)
  const [reloads, setReloads] = useState(0)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [activity, setActivity] = useState<{ owner: string; events: ActivityEvent[] } | null>(null)
  const [activityError, setActivityError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [lessonFilter, setLessonFilter] = useState<LessonFilter>('all')
  const items: readonly RoadmapProgressItem[] = roadmapProgressManifest[roadmapId]
  const itemsBySourceLine = useMemo(() => new Map(items.map((item) => [item.sourceLine, item])), [items])
  const lessonsByItem = useMemo(() => {
    const grouped = new Map<string, TrackedLesson[]>()
    for (const lesson of lessons) grouped.set(lesson.roadmapItemId, [...(grouped.get(lesson.roadmapItemId) ?? []), lesson])
    return grouped
  }, [lessons])
  const loaded = owner !== null && saved?.owner === owner
  const loading = authStatus === 'loading' || (owner !== null && !loaded && !error)
  const statuses = useMemo(() => (loaded ? saved.statuses : {}), [loaded, saved])

  useEffect(() => {
    if (!owner) return
    let active = true
    progressApi.list(roadmapId)
      .then((result) => {
        if (!active) return
        setSaved({ owner, statuses: result })
        setError('')
      })
      .catch((cause: unknown) => {
        if (!active) return
        const expired = cause instanceof ApiError && cause.status === 401
        if (expired) markSignedOut()
        setError(expired ? 'Your session expired. Sign in again to load progress.' : 'Could not load saved progress.')
      })
    return () => { active = false }
  }, [owner, roadmapId, reloads, markSignedOut])

  // The calendar is secondary: a failure here shows its own message and never blocks the roadmap.
  useEffect(() => {
    if (!owner) return
    let active = true
    progressApi.activity(roadmapId)
      .then((events) => {
        if (!active) return
        setActivity({ owner, events })
        setActivityError('')
      })
      .catch(() => { if (active) setActivityError('Could not load your learning history.') })
    return () => { active = false }
  }, [owner, roadmapId, reloads])
  const activityEvents = useMemo(() => (owner && activity?.owner === owner ? activity.events : []), [owner, activity])

  const updateStatus = useCallback(async (itemId: string, status: ProgressStatus | 'not_started') => {
    if (!owner || savingItem) return
    setSavingItem(itemId)
    setError('')
    try {
      await progressApi.save(roadmapId, itemId, status)
      setSaved((previous) => {
        const next = { ...(previous?.owner === owner ? previous.statuses : {}) }
        if (status === 'not_started') delete next[itemId]
        else next[itemId] = status
        return { owner, statuses: next }
      })
      // Mirrors the event the server just logged, so today's calendar cell updates without a refetch.
      setActivity((previous) => ({
        owner,
        events: [{ itemId, status, at: new Date().toISOString() }, ...(previous?.owner === owner ? previous.events : [])],
      }))
    } catch (cause) {
      const expired = cause instanceof ApiError && cause.status === 401
      if (expired) markSignedOut()
      setError(expired ? 'Your session expired. Sign in again to save progress.' : 'Could not save this progress update.')
    } finally {
      setSavingItem(null)
    }
  }, [owner, markSignedOut, roadmapId, savingItem])

  const modules = useMemo(() => {
    const grouped = new Map<string, RoadmapProgressItem[]>()
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
  const readCount = lessons.filter((lesson) => statuses[lesson.id] === 'completed').length
  const shownCount = items.filter((item) =>
    matchesFilters(statuses[item.id] ?? 'not_started', lessonsByItem.get(item.id), statuses, statusFilter, lessonFilter)).length
  const filtering = statusFilter !== 'all' || lessonFilter !== 'all'

  const itemState = useMemo<RoadmapItemState>(() => ({
    roadmapId,
    itemsBySourceLine,
    lessonsByItem,
    statuses,
    loaded,
    saving: savingItem !== null,
    statusFilter,
    lessonFilter,
    updateStatus: (itemId, status) => { void updateStatus(itemId, status) },
  }), [roadmapId, itemsBySourceLine, lessonsByItem, statuses, loaded, savingItem, statusFilter, lessonFilter, updateStatus])
  // Parsed once per roadmap; items still update through context.
  const article = useMemo(() => <MarkdownView markdown={markdown} components={roadmapComponents} />, [markdown])


  return (
    <div className={styles.progressView}>
      <section className={styles.summary} aria-label="Roadmap progress summary">
        <div className={styles.summaryHeading}>
          <div>
            <p className={styles.label}>Your roadmap progress</p>
            <h2>{isSignedIn ? `${completedCount} of ${items.length} complete` : 'Read the roadmap without signing in'}</h2>
            <p>{isSignedIn ? `${inProgressCount} in progress · ${readCount} of ${lessons.length} lessons read` : 'Sign in to save progress and continue later.'}</p>
          </div>
          {!isSignedIn && <Link className={styles.signInLink} to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>Sign in to track progress</Link>}
          {isSignedIn && nextItem && <a className={styles.continueLink} href={`#${itemAnchorId(nextItem.id)}`}>Continue learning →</a>}
          {isSignedIn && !nextItem && <span className={styles.doneMessage}>Roadmap complete ✓</span>}
        </div>
        {isSignedIn && loaded && <div className={styles.chartRow}>
          <ProgressDonut counts={{ completed: completedCount, in_progress: inProgressCount, not_started: items.length - completedCount - inProgressCount }} />
          <div className={styles.moduleProgress}>
            {modules.map(([moduleId, moduleItems]) => {
              const done = moduleItems.filter((item) => statuses[item.id] === 'completed').length
              const label = moduleId === 'course' ? 'Course items' : `Module ${moduleId.slice(7)}`
              return (
                <div className={styles.moduleRow} key={moduleId}>
                  <span>{label}</span><span>{done}/{moduleItems.length} complete</span>
                  <span className={styles.moduleBar} aria-hidden="true"><span style={{ width: `${(done / moduleItems.length) * 100}%` }} /></span>
                </div>
              )
            })}
          </div>
        </div>}
        {error && <p className={styles.error} role="alert">{error} <button type="button" onClick={() => { setError(''); setReloads((count) => count + 1) }}>Retry</button></p>}
      </section>
      {isSignedIn && loaded && <LearningCalendar events={activityEvents} error={activityError} />}
      <div className={styles.filterBar} role="group" aria-label="Filter roadmap items">
        {isSignedIn && loaded && <div className={styles.filterGroup} role="radiogroup" aria-label="Status">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={statusFilter === value}
              className={`${styles.filterChip} ${value === 'all' ? '' : STATUS_CLASSES[value]}`}
              onClick={() => setStatusFilter(value)}
            >
              {value !== 'all' && <span className={styles.filterDot} aria-hidden="true" />}{label}
            </button>
          ))}
        </div>}
        <label className={styles.filterSelect}>
          <span>Lessons</span>
          <select value={lessonFilter} onChange={(event) => setLessonFilter(event.currentTarget.value as LessonFilter)}>
            <option value="all">All items</option>
            <option value="has_lesson">Has a lesson</option>
            {loaded && <option value="unread_lesson">Unread lesson</option>}
          </select>
        </label>
        <span className={styles.filterCount} role="status">
          {filtering ? `${shownCount} of ${items.length} items shown` : `${items.length} items`}
          {filtering && <button type="button" onClick={() => { setStatusFilter('all'); setLessonFilter('all') }}>Clear</button>}
        </span>
      </div>
      <div className={styles.roadmapArticle}>
        <RoadmapItemContext.Provider value={itemState}>{article}</RoadmapItemContext.Provider>
      </div>
      {loading && <p className={styles.loading} role="status">Loading saved progress…</p>}
    </div>
  )
}
