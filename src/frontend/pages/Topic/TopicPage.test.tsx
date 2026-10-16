import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getLessonCatalog } from '../../content.ts'
import { renderRoute } from '../../test/renderRoute.tsx'

describe('TopicPage', () => {
  it('lists the published MCP lessons in module and lesson order', () => {
    renderRoute('/MCP')

    const expected = [...(getLessonCatalog().MCP ?? [])]
      .sort((left, right) => (left.module?.order ?? Infinity) - (right.module?.order ?? Infinity) || left.order - right.order)
      .map((lesson) => `/MCP/${lesson.slug}`)
    const links = screen.getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href) => href?.startsWith('/MCP/') && href !== '/MCP/roadmap')

    expect(screen.getByRole('heading', { name: 'Node.js MCP Server Learning Course' })).toBeInTheDocument()
    expect(links).toEqual(expected)
  })

  it('shows not found for a topic with no published lessons', () => {
    renderRoute('/nothing-yet')

    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeInTheDocument()
  })
})
