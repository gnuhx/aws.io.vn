import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { lessonFile, renderRoute } from '../../test/renderRoute.tsx'

const body = `# IAM intro

## Concept
IAM controls who can do what.

## Building Blocks

| Item | What it does |
| ---- | ------------ |
| User | A person or app |
`

describe('LessonPage', () => {
  it('renders the title once and every ## section', () => {
    renderRoute('/aws-saa-c03/01-iam-intro', {
      'content/aws-saa-c03/01-iam-intro.md': lessonFile('aws-saa-c03', 'IAM intro', 1, body),
    })

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'IAM intro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Concept' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Building Blocks' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'A person or app' })).toBeInTheDocument()
  })
})
