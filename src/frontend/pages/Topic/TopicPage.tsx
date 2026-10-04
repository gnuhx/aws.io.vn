import { Link, useParams } from 'react-router'
import { getLessonCatalog } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'

export function TopicPage() {
  const { topic = '' } = useParams()
  const catalog = getLessonCatalog()
  const lessons = catalog[topic] ?? []

  if (!lessons.length) {
    return <NotFoundPage />
  }

  return (
    <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <Link to="/">← Back to topics</Link>
      <h1 style={{ marginTop: '1rem' }}>{topic.replace(/-/g, ' ')}</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
        {lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              to={`/${topic}/${lesson.slug}`}
              style={{ display: 'block', padding: '1rem 1.25rem', border: '1px solid #ddd', borderRadius: 12, textDecoration: 'none', color: '#111' }}
            >
              <strong>{lesson.title}</strong>
              <div style={{ color: '#555', marginTop: 6 }}>{lesson.summary}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
