import { Link } from 'react-router'
import { getTopics } from '../../content.ts'
import styles from './HomePage.module.css'

export function HomePage() {
  const topics = getTopics()

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>aws.io.vn</p>
        <h1 className={styles.title}>AWS Learning Paths</h1>
        <p className={styles.lead}>A calm, practical study flow for engineers who like to learn by seeing the full picture first.</p>
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
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}
