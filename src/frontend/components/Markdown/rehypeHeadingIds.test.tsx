import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownView } from './MarkdownView.tsx'
import { slugify } from './rehypeHeadingIds.ts'

describe('heading ids', () => {
  it('slugifies to ASCII', () => {
    expect(slugify('Cấu hình VPC & Subnets')).toBe('cau-hinh-vpc-subnets')
    expect(slugify('Đường đi')).toBe('duong-di')
    expect(slugify('***')).toBe('section')
  })

  it('gives headings stable, unique ids in document order', () => {
    const { container } = render(<MarkdownView markdown={'# Intro\n\n## Setup `npm`\n\n### Intro\n\n## Intro-2\n\nText'} />)
    expect([...container.querySelectorAll('h1, h2, h3')].map((heading) => heading.id)).toEqual(['intro', 'setup-npm', 'intro-2', 'intro-2-2'])
  })
})
