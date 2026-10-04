import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { lessonFile, renderRoute } from '../../test/renderRoute.tsx'

describe('NotFoundPage', () => {
  it.each(['/nope', '/nope/nope', '/reactjs/nope', '/a/b/c'])('shows for %s', (url) => {
    renderRoute(url, { 'content/reactjs/a.md': lessonFile('reactjs', 'First', 1) })

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
