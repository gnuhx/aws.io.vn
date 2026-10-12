import styles from './ProgressRing.module.css'

const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Compact completion ring: completed arc, then in-progress arc, % complete in the center. */
export function ProgressRing({ completed, inProgress, total }: { completed: number; inProgress: number; total: number }) {
  const share = (count: number) => (total ? (count / total) * CIRCUMFERENCE : 0)
  const percent = total ? Math.round((completed / total) * 100) : 0
  const notStarted = total - completed - inProgress

  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 72 72" role="img" aria-label={`${completed} completed, ${inProgress} in progress, ${notStarted} not started`}>
        <circle className={styles.track} cx="36" cy="36" r={RADIUS} />
        {inProgress > 0 && (
          <circle
            className={`${styles.arc} ${styles.inProgress}`}
            cx="36" cy="36" r={RADIUS}
            strokeDasharray={`${Math.max(share(inProgress), 1)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-share(completed)}
          />
        )}
        {completed > 0 && (
          <circle
            className={`${styles.arc} ${styles.completed}`}
            cx="36" cy="36" r={RADIUS}
            strokeDasharray={`${Math.max(share(completed), 1)} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <span className={styles.center} aria-hidden="true">{percent}%</span>
    </div>
  )
}
