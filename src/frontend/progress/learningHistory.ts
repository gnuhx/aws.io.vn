/** Local calendar date as `YYYY-MM-DD`, so a session at 6am in UTC+7 lands on the learner's own day. */
export function localDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export type LearningSummary = {
  /** Status changes per local day. */
  countsByDay: Map<string, number>
  activeDays: number
  /** Consecutive active days ending today, or yesterday when today has no activity yet. */
  currentStreak: number
  longestStreak: number
  /** Whole days since the last active day; null when there is no activity at all. */
  daysSinceLast: number | null
}

export function summarizeActivity(events: readonly { at: string }[], today = new Date()): LearningSummary {
  const countsByDay = new Map<string, number>()
  for (const event of events) {
    const at = new Date(event.at)
    if (Number.isNaN(at.getTime())) continue
    const key = localDayKey(at)
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  const days = [...countsByDay.keys()].sort()
  let longestStreak = 0
  let run = 0
  let previous: string | undefined
  for (const day of days) {
    run = previous && localDayKey(addDays(new Date(`${previous}T00:00:00`), 1)) === day ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    previous = day
  }

  let cursor = countsByDay.has(localDayKey(today)) ? today : addDays(today, -1)
  let currentStreak = 0
  while (countsByDay.has(localDayKey(cursor))) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  const last = days.at(-1)
  const daysSinceLast = last
    ? Math.round((addDays(today, 0).getTime() - new Date(`${last}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000))
    : null

  return { countsByDay, activeDays: days.length, currentStreak, longestStreak, daysSinceLast }
}
