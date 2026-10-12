import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/authContext.ts'
import { ProgressRing } from '../../components/ProgressRing/ProgressRing.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { getTopics, getTrackedLessons } from '../../content.ts'
import { progressApi, type SavedStatuses } from '../../progress/api.ts'
import { isRoadmapId, roadmapProgressManifest, type RoadmapId } from '../../../shared/roadmapProgress.ts'
import styles from './HomePage.module.css'

type TopicProgress = { state: 'loading' } | { state: 'error' } | { state: 'loaded'; statuses: SavedStatuses }

/** Loads saved statuses for every roadmap topic; results are tagged with their owner so a sign-out never shows stale rings. */
function useTopicProgress(roadmapIds: RoadmapId[]) {
  const { status, user } = useAuth()
  const owner = status === 'signed-in' && user ? user.id : null
  const [results, setResults] = useState<{ owner: string; byRoadmap: Partial<Record<RoadmapId, TopicProgress>> } | null>(null)
  const key = roadmapIds.join(',')

  useEffect(() => {
    if (!owner) return
    let active = true
    const save = (roadmapId: RoadmapId, progress: TopicProgress) => {
      if (!active) return
      setResults((previous) => ({ owner, byRoadmap: { ...(previous?.owner === owner ? previous.byRoadmap : {}), [roadmapId]: progress } }))
    }
    for (const roadmapId of key.split(',').filter(isRoadmapId)) {
      progressApi.list(roadmapId)
        .then((statuses) => save(roadmapId, { state: 'loaded', statuses }))
        .catch(() => save(roadmapId, { state: 'error' }))
    }
    return () => { active = false }
  }, [owner, key])

  return {
    signedIn: owner !== null,
    authLoading: status === 'loading',
    progressFor: (roadmapId: RoadmapId): TopicProgress =>
      (owner && results?.owner === owner ? results.byRoadmap[roadmapId] : undefined) ?? { state: 'loading' },
  }
}

function TopicProgressSummary({ roadmapId, progress, signedIn }: { roadmapId: RoadmapId; progress: TopicProgress; signedIn: boolean }) {
  const items = roadmapProgressManifest[roadmapId]

  if (!signedIn) {
    return <p className={styles.progressHint}>{items.length} roadmap items · sign in to track progress</p>
  }
  if (progress.state === 'loading') {
    return <p className={styles.progressHint} role="status"><Spinner /> Loading your progress…</p>
  }
  if (progress.state === 'error') {
    return <p className={styles.progressError}>Couldn’t load progress right now.</p>
  }

  const { statuses } = progress
  const completed = items.filter((item) => statuses[item.id] === 'completed').length
  const inProgress = items.filter((item) => statuses[item.id] === 'in_progress').length
  const lessons = getTrackedLessons(roadmapId)
  const read = lessons.filter((lesson) => statuses[lesson.id] === 'completed').length

  return (
    <div className={styles.progress}>
      <ProgressRing completed={completed} inProgress={inProgress} total={items.length} />
      <div className={styles.progressText}>
        <strong>{completed} of {items.length} items complete</strong>
        <span>{inProgress} in progress{lessons.length > 0 && ` · ${read} of ${lessons.length} lessons read`}</span>
      </div>
    </div>
  )
}

export function HomePage() {
  const topics = getTopics()
  const roadmapIds = topics.map(({ topic }) => topic).filter(isRoadmapId)
  const { signedIn, authLoading, progressFor } = useTopicProgress(roadmapIds)

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>aws.io.vn</p>
        <h1 className={styles.title}>Engineering Learning Paths</h1>
        <p className={styles.lead}>Practical, project-based courses for building and operating modern software.</p>
      </header>

      {topics.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>No lessons discovered yet</h2>
          <p>Add markdown or HTML lesson files under the content folders to populate the site.</p>
        </section>
      ) : (
        <section className={styles.grid}>
          {topics.map(({ topic, label, lessons }) => (
            <Link key={topic} to={`/${topic}`} className={styles.card}>
              <div className={styles.cardMeta}>{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</div>
              <h2>{label}</h2>
              <p>Explore the {label.toLowerCase()} curriculum.</p>
              {isRoadmapId(topic) && !authLoading && (
                <TopicProgressSummary roadmapId={topic} progress={progressFor(topic)} signedIn={signedIn} />
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}
