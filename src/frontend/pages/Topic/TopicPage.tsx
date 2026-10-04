import { Link, useParams } from 'react-router'
import type { LessonIndex } from '@shared/lessons/parse.ts'
import { isTopic, TOPIC_LABELS } from '@shared/schemas/lesson.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './TopicPage.module.css'

type Props = { index: LessonIndex }

export function TopicPage({ index }: Props) {
  const { topic } = useParams()
  if (!isTopic(topic)) return <NotFoundPage />

  const lessons = index[topic]

  return (
    <main className={styles.page}>
      <Link to="/">← All topics</Link>
      <h1>{TOPIC_LABELS[topic]}</h1>
      {lessons.length === 0 ? (
        <p className={styles.empty}>No lessons in this topic yet.</p>
      ) : (
        <ol className={styles.lessons}>
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link to={`/${topic}/${lesson.slug}`}>{lesson.title}</Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
