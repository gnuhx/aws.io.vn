import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main style={{ maxWidth: '48rem', margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Lesson not found</h1>
      <p>The topic or lesson you requested is not available yet.</p>
      <Link to="/">Back to learning paths</Link>
    </main>
  )
}
