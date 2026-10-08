import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { getCourseRoadmap } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './CourseRoadmapPage.module.css'

const MarkdownView = lazy(() => import('../../components/Markdown/MarkdownView.tsx').then((module) => ({ default: module.MarkdownView })))

export function CourseRoadmapPage() {
  const { topic = '' } = useParams()
  const roadmap = topic === 'aws-saa-c03' ? getCourseRoadmap() : ''

  if (!roadmap) return <NotFoundPage />

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to={`/${topic}`} className={styles.backLink}>← Back to course</Link>
        <p className={styles.eyebrow}>AWS SAA-C03 · Course map</p>
        <h1>Full course roadmap</h1>
        <p className={styles.intro}>Browse the complete syllabus and its numbered lessons.</p>
      </header>
      <article className={styles.article}>
        <Suspense fallback={<p>Loading roadmap…</p>}>
          <MarkdownView markdown={roadmap} />
        </Suspense>
      </article>
    </main>
  )
}
