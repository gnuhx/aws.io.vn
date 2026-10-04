import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage.tsx'

describe('HomePage', () => {
  it('shows the available learning topics', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /aws learning paths/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /aws saa-c03/i })).toBeInTheDocument()
  })
})
