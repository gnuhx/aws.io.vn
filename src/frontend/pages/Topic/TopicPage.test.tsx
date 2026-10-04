import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { lessonFile, renderRoute } from '../../test/renderRoute.tsx'

describe('TopicPage', () => {
  it('lists lessons in order', () => {
    renderRoute('/reactjs', {
      'content/reactjs/b.md': lessonFile('reactjs', 'Second', 2),
      'content/reactjs/a.md': lessonFile('reactjs', 'First', 1),
      'content/reactjs/c.md': lessonFile('reactjs', 'Third', 3),
    })

    const links = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(links).toEqual(['First', 'Second', 'Third'])
    expect(screen.getByRole('link', { name: 'First' })).toHaveAttribute('href', '/reactjs/a')
  })

  it('shows an empty state for a topic with no lessons', () => {
    renderRoute('/context-engineering')

    expect(screen.getByRole('heading', { name: 'Context Engineering' })).toBeInTheDocument()
    expect(screen.getByText('No lessons in this topic yet.')).toBeInTheDocument()
  })
})
