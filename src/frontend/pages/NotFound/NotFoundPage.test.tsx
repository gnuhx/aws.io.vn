import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute.tsx'

describe('NotFoundPage', () => {
  it.each(['/nope', '/nope/nope', '/reactjs/nope', '/a/b/c'])('shows for %s', (url) => {
    renderRoute(url)

    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeInTheDocument()
  })
})
