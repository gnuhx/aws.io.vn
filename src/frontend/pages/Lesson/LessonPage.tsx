import { Link, useParams } from 'react-router'
import { findLesson } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'

export function LessonPage() {
  const { topic = '', slug = '' } = useParams()
  const lesson = findLesson(topic, slug)

  if (!lesson) {
    return <NotFoundPage />
  }

  return (
    <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <Link to={`/${topic}`}>← Back to {topic.replace(/-/g, ' ')}</Link>
      <article style={{ marginTop: '1rem' }}>
        <h1>{lesson.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: lesson.bodyHtml }} />
      </article>
    </main>
  )
}
