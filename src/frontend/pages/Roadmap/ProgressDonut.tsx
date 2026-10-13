import { useState } from 'react'
import styles from './ProgressCharts.module.css'

export type StatusCounts = { completed: number; in_progress: number; not_started: number }

const SEGMENTS = [
  { key: 'completed', label: 'Completed', className: styles.completed },
  { key: 'in_progress', label: 'In progress', className: styles.inProgress },
  { key: 'not_started', label: 'Not started', className: styles.notStarted },
] as const

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 2

const percent = (value: number, total: number) => (total ? Math.round((value / total) * 100) : 0)

/** Share of roadmap items per status. Legend + counts carry identity, so color is never the only cue. */
export function ProgressDonut({ counts }: { counts: StatusCounts }) {
  const [active, setActive] = useState<keyof StatusCounts | null>(null)
  const total = counts.completed + counts.in_progress + counts.not_started
  const visible = SEGMENTS.filter(({ key }) => counts[key] > 0)
  const gap = visible.length > 1 ? GAP : 0
  const arcs = visible.map((segment, index) => ({
    ...segment,
    length: (counts[segment.key] / total) * CIRCUMFERENCE,
    offset: visible.slice(0, index).reduce((sum, { key }) => sum + (counts[key] / total) * CIRCUMFERENCE, 0),
  }))
  const focus = SEGMENTS.find(({ key }) => key === active)
  // Touch screens have no hover: a tap highlights a status, a second tap clears it.
  const toggle = (key: keyof StatusCounts) => setActive((current) => (current === key ? null : key))

  return (
    <div className={styles.donutBlock}>
      <div className={styles.donut}>
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-label={`${counts.completed} completed, ${counts.in_progress} in progress, ${counts.not_started} not started`}
        >
          <circle className={styles.donutTrack} cx="60" cy="60" r={RADIUS} />
          {arcs.map(({ key, className, length, offset }) => (
            <circle
              key={key}
              className={`${styles.donutSegment} ${className} ${active && active !== key ? styles.dimmed : ''}`}
              cx="60"
              cy="60"
              r={RADIUS}
              strokeDasharray={`${Math.max(length - gap, 0.5)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-offset}
              onMouseEnter={() => setActive(key)}
              onMouseLeave={() => setActive(null)}
              onClick={() => toggle(key)}
            />
          ))}
        </svg>
        <div className={styles.donutCenter} aria-hidden="true">
          <strong>{focus ? counts[focus.key] : `${percent(counts.completed, total)}%`}</strong>
          <span>{focus ? focus.label.toLowerCase() : 'complete'}</span>
        </div>
      </div>
      <ul className={styles.legend}>
        {SEGMENTS.map(({ key, label, className }) => (
          <li
            key={key}
            className={active === key ? styles.legendActive : undefined}
            onMouseEnter={() => setActive(key)}
            onMouseLeave={() => setActive(null)}
            onClick={() => toggle(key)}
          >
            <span className={`${styles.swatch} ${className}`} aria-hidden="true" />
            <span className={styles.legendLabel}>{label}</span>
            <span className={styles.legendValue}>{counts[key]} <small>({percent(counts[key], total)}%)</small></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
