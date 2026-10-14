import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LearningCalendar } from './LearningCalendar.tsx'

describe('LearningCalendar', () => {
  it('shows a day\'s updates on tap, not only on hover', () => {
    const today = new Date(2026, 9, 12, 12)
    const { container } = render(<LearningCalendar today={today} events={[{ itemId: 'a', status: 'completed', at: today.toISOString() }]} />)

    expect(screen.getByText('Hover or tap a day to see its updates.')).toBeInTheDocument()
    fireEvent.click(container.querySelector('[data-day][data-count="1"]')!)
    expect(screen.queryByText('Hover or tap a day to see its updates.')).not.toBeInTheDocument()
    expect(screen.getByText(/· 1 update$/)).toBeInTheDocument()
  })
})
