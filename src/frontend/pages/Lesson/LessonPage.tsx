import Markdown from 'react-markdown'
import { Link, useParams } from 'react-router'
import remarkGfm from 'remark-gfm'
import { findLesson, type LessonIndex } from '@shared/lessons/parse.ts'
import { isTopic, TOPIC_LABELS } from '@shared/schemas/lesson.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './LessonPage.module.css'

type Props = { index: LessonIndex }

// The template repeats the title as `# Title` in the body; the page already shows it as the h1.
function stripTitleHeading(body: string, title: string) {
  const match = /^\s*#\s+(.+?)\s*(?:\r?\n|$)/.exec(body)
  return match && match[1] === title ? body.slice(match[0].length) : body
}

export function LessonPage({ index }: Props) {
  const { topic, slug = '' } = useParams()
  const lesson = isTopic(topic) ? findLesson(index, topic, slug) : undefined
  if (!lesson) return <NotFoundPage />

  return (
    <main className={styles.page}>
      <Link to={`/${lesson.topic}`}>← {TOPIC_LABELS[lesson.topic]}</Link>
      <article className={styles.article}>
        <h1>{lesson.title}</h1>
        <Markdown remarkPlugins={[remarkGfm]}>
          {stripTitleHeading(lesson.body, lesson.title)}
        </Markdown>
      </article>
    </main>
  )
}
