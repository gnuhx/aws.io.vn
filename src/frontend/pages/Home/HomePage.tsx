import { Link } from 'react-router'
import { TOPICS, TOPIC_LABELS } from '@shared/schemas/lesson.ts'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>aws.io.vn</h1>
      <p className={styles.lead}>AI study assistant. Pick a topic to start.</p>
      <ul className={styles.topics}>
        {TOPICS.map((topic) => (
          <li key={topic}>
            <Link to={`/${topic}`}>{TOPIC_LABELS[topic]}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
