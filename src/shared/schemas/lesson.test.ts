import { describe, expect, it } from 'vitest'
import { lessonFrontmatterSchema } from './lesson.ts'

const valid = {
  title: 'IAM intro',
  topic: 'aws-saa-c03',
  order: 1,
  date: '2026-10-02',
  tags: ['IAM'],
}

function issuePaths(data: unknown) {
  const result = lessonFrontmatterSchema.safeParse(data)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('lessonFrontmatterSchema', () => {
  it('accepts valid frontmatter, with or without domain', () => {
    expect(issuePaths(valid)).toEqual([])
    expect(issuePaths({ ...valid, domain: 'Design Secure Architectures' })).toEqual([])
  })

  it('rejects a missing title', () => {
    const withoutTitle: Partial<typeof valid> = { ...valid }
    delete withoutTitle.title
    expect(issuePaths(withoutTitle)).toEqual(['title'])
  })

  it('rejects an unknown topic', () => {
    expect(issuePaths({ ...valid, topic: 'aws' })).toEqual(['topic'])
  })
})
