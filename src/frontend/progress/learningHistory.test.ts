import { describe, expect, it } from 'vitest'
import { localDayKey, summarizeActivity } from './learningHistory.ts'

// Local-time constructors keep these tests independent of the machine's timezone.
const at = (day: number, hour = 10, month = 9) => ({ at: new Date(2026, month, day, hour).toISOString() })
const today = new Date(2026, 9, 11, 15)

describe('summarizeActivity', () => {
  it('counts events per local day', () => {
    const summary = summarizeActivity([at(10), at(10, 23), at(11, 1)], today)
    expect(summary.countsByDay.get('2026-10-10')).toBe(2)
    expect(summary.countsByDay.get('2026-10-11')).toBe(1)
    expect(summary.activeDays).toBe(2)
  })

  it('finds the current and the longest streak', () => {
    const summary = summarizeActivity([at(1), at(2), at(3), at(4), at(9), at(10), at(11)], today)
    expect(summary.longestStreak).toBe(4)
    expect(summary.currentStreak).toBe(3)
    expect(summary.daysSinceLast).toBe(0)
  })

  it('keeps the streak alive until today ends', () => {
    expect(summarizeActivity([at(9), at(10)], today).currentStreak).toBe(2)
  })

  it('breaks the streak after a missed day and reports idle days', () => {
    const summary = summarizeActivity([at(5), at(6)], today)
    expect(summary.currentStreak).toBe(0)
    expect(summary.longestStreak).toBe(2)
    expect(summary.daysSinceLast).toBe(5)
  })

  it('handles streaks across a month boundary', () => {
    expect(summarizeActivity([at(30, 10, 8), at(1)], new Date(2026, 9, 1, 12)).currentStreak).toBe(2)
  })

  it('has no idle count without activity', () => {
    const summary = summarizeActivity([], today)
    expect(summary).toMatchObject({ activeDays: 0, currentStreak: 0, longestStreak: 0, daysSinceLast: null })
    expect(localDayKey(today)).toBe('2026-10-11')
  })
})
