import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ActivityEvent } from '../../progress/api.ts'
import { addDays, localDayKey, summarizeActivity } from '../../progress/learningHistory.ts'
import styles from './ProgressCharts.module.css'

const WEEKS = 53
const LEVEL_CLASSES = [styles.level0, styles.level1, styles.level2, styles.level3, styles.level4]
const level = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4)
const dayLabel = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

function idleMessage(daysSinceLast: number | null) {
  if (daysSinceLast === null) return 'No learning logged yet. Change a status to start your streak.'
  if (daysSinceLast === 0) return 'You studied today. Keep the streak going!'
  if (daysSinceLast === 1) return 'Last studied yesterday. Study today to keep your streak.'
  if (daysSinceLast < 7) return `${plural(daysSinceLast, 'day')} since you last studied.`
  return `${daysSinceLast} days without learning. Time to get back to it!`
}

/** GitHub-style heatmap of status changes per local day over the last year. */
export function LearningCalendar({ events, error, today: todayProp }: { events: readonly ActivityEvent[]; error?: string; today?: Date }) {
  const [now] = useState(() => new Date())
  const today = todayProp ?? now
  const summary = useMemo(() => summarizeActivity(events, today), [events, today])
  const [hovered, setHovered] = useState<{ date: Date; count: number } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // Weeks run Sunday → Saturday; the last column holds today.
  const { weeks, months } = useMemo(() => {
    const start = addDays(today, -((WEEKS - 1) * 7 + today.getDay()))
    const todayKey = localDayKey(today)
    const weeks: { date: Date; key: string; count: number }[][] = []
    const months: { column: number; label: string }[] = []
    for (let week = 0; week < WEEKS; week += 1) {
      const days = []
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = addDays(start, week * 7 + weekday)
        const key = localDayKey(date)
        if (key > todayKey) break
        days.push({ date, key, count: summary.countsByDay.get(key) ?? 0 })
        if (date.getDate() === 1) months.push({ column: week, label: date.toLocaleDateString(undefined, { month: 'short' }) })
      }
      weeks.push(days)
    }
    return { weeks, months }
  }, [today, summary])

  // Keep the most recent weeks in view on narrow screens.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [])

  const idle = summary.daysSinceLast !== null && summary.daysSinceLast >= 7

  return (
    <section className={styles.calendar} aria-label="Learning history">
      <div className={styles.calendarHeading}>
        <div>
          <p className={styles.calendarLabel}>Learning history</p>
          <p className={`${styles.idleMessage} ${idle ? styles.idleWarning : ''}`}>{idleMessage(summary.daysSinceLast)}</p>
        </div>
        <dl className={styles.stats}>
          <div><dt>Active days</dt><dd>{summary.activeDays}</dd></div>
          <div><dt>Current streak</dt><dd>{plural(summary.currentStreak, 'day')}</dd></div>
          <div><dt>Longest streak</dt><dd>{plural(summary.longestStreak, 'day')}</dd></div>
        </dl>
      </div>
      <div className={styles.calendarScroll} ref={scroller}>
        <div
          className={styles.calendarGrid}
          role="img"
          aria-label={`Activity calendar for the last year: ${summary.activeDays} active days, current streak ${summary.currentStreak}, longest streak ${summary.longestStreak}`}
          onMouseLeave={() => setHovered(null)}
        >
          {months.map(({ column, label }) => (
            <span key={`${column}-${label}`} className={styles.monthLabel} style={{ gridColumn: column + 2 }}>{label}</span>
          ))}
          {['Mon', 'Wed', 'Fri'].map((label, index) => (
            <span key={label} className={styles.weekdayLabel} style={{ gridRow: index * 2 + 3 }}>{label}</span>
          ))}
          {weeks.flatMap((days, week) => days.map(({ date, key, count }) => (
            <span
              key={key}
              data-day={key}
              data-count={count}
              className={`${styles.day} ${LEVEL_CLASSES[level(count)]}`}
              style={{ gridColumn: week + 2, gridRow: date.getDay() + 2 }}
              title={`${dayLabel(date)}: ${plural(count, 'update')}`}
              onMouseEnter={() => setHovered({ date, count })}
            />
          )))}
        </div>
      </div>
      <div className={styles.calendarFooter}>
        <span className={styles.hoverCaption} aria-live="polite">
          {hovered ? `${dayLabel(hovered.date)} · ${plural(hovered.count, 'update')}` : 'Hover a day to see its updates.'}
        </span>
        <span className={styles.scale} aria-hidden="true">
          Less {LEVEL_CLASSES.map((className) => <span key={className} className={`${styles.day} ${className}`} />)} More
        </span>
      </div>
      {error && <p className={styles.calendarError} role="alert">{error}</p>}
    </section>
  )
}
