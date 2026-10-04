import { Link } from 'react-router'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <h1>Page not found</h1>
      <p>There is no lesson or topic at this address.</p>
      <Link to="/">Go to all topics</Link>
    </main>
  )
}
