import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute.tsx'

describe('HomePage', () => {
  it('shows the site heading and links to every topic', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { name: 'aws.io.vn' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AWS SAA-C03' })).toHaveAttribute(
      'href',
      '/aws-saa-c03',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})
