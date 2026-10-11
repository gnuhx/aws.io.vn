import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { getCourseRoadmap, getPublishedModuleOrders, getTopicLabel } from '../../content.ts'
import { isRoadmapId } from '../../../shared/roadmapProgress.ts'
import { RoadmapProgressView } from './RoadmapProgressView.tsx'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './CourseRoadmapPage.module.css'

const MarkdownView = lazy(() => import('../../components/Markdown/MarkdownView.tsx').then((module) => ({ default: module.MarkdownView })))
const clerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

export function CourseRoadmapPage() {
  const { topic = '' } = useParams()
  const roadmap = getCourseRoadmap(topic)
  const publishedModules = getPublishedModuleOrders(topic)

  if (!roadmap || !isRoadmapId(topic)) return <NotFoundPage />

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to={`/${topic}`} className={styles.backLink}>← Back to course</Link>
        <p className={styles.eyebrow}>{getTopicLabel(topic)} · Course map</p>
        <h1>Full course roadmap</h1>
        <p className={styles.intro}>Browse the complete syllabus and its numbered lessons.</p>
      </header>
      <article className={styles.article}>
        {topic === 'MCP' && (
          <p className={styles.statusNote}>
            <strong>Published on this site:</strong> Modules {publishedModules.join(', ')}. Other modules are roadmap plans and do not yet have published lesson pages.
          </p>
        )}
        {clerkConfigured ? (
          <RoadmapProgressView roadmapId={topic} markdown={roadmap} />
        ) : (
          <Suspense fallback={<p>Loading roadmap…</p>}>
            <MarkdownView markdown={roadmap} />
          </Suspense>
        )}
      </article>
    </main>
  )
}
