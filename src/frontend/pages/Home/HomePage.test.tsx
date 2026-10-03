import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage.tsx'

describe('HomePage', () => {
  it('shows the site heading', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: 'aws.io.vn' })).toBeInTheDocument()
  })
})
