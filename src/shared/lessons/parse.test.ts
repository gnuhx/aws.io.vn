import { describe, expect, it } from 'vitest'
import { buildLessonIndex, findLesson, LessonParseError, parseLesson } from './parse.ts'

function lessonFile(frontmatter: string, body = '# Title\n\n## Concept\nText.\n') {
  return `---\n${frontmatter}\n---\n${body}`
}

const iamIntro = lessonFile(
  'title: IAM intro\ntopic: aws-saa-c03\norder: 1\ndate: 2026-10-02\ntags: [IAM]',
)

describe('parseLesson', () => {
  it('parses frontmatter, slug and body', () => {
    const lesson = parseLesson('content/aws-saa-c03/01-iam-intro.md', iamIntro)

    expect(lesson).toEqual({
      title: 'IAM intro',
      topic: 'aws-saa-c03',
      order: 1,
      date: '2026-10-02',
      tags: ['IAM'],
      slug: '01-iam-intro',
      body: '# Title\n\n## Concept\nText.\n',
    })
  })

  it('names the file and field when title is missing', () => {
    const raw = lessonFile('topic: aws-saa-c03\norder: 1\ndate: 2026-10-02\ntags: []')

    expect(() => parseLesson('content/aws-saa-c03/x.md', raw)).toThrow(
      /^content\/aws-saa-c03\/x\.md: title: /,
    )
  })

  it('names the file and field when topic is unknown', () => {
    const raw = lessonFile('title: X\ntopic: aws\norder: 1\ndate: 2026-10-02\ntags: []')

    expect(() => parseLesson('content/aws/x.md', raw)).toThrow(/^content\/aws\/x\.md: topic: /)
  })

  it('rejects a topic that does not match the folder', () => {
    expect(() => parseLesson('content/reactjs/01-iam-intro.md', iamIntro)).toThrow(
      'topic: "aws-saa-c03" does not match folder "reactjs"',
    )
  })

  it('rejects a file without frontmatter', () => {
    expect(() => parseLesson('content/reactjs/x.md', '# No frontmatter')).toThrow(LessonParseError)
  })
})

describe('buildLessonIndex', () => {
  const fixture = (order: number) =>
    lessonFile(
      `title: Lesson ${order}\ntopic: reactjs\norder: ${order}\ndate: 2026-10-02\ntags: []`,
    )

  it('sorts lessons by order within a topic', () => {
    const index = buildLessonIndex({
      'content/reactjs/b.md': fixture(2),
      'content/reactjs/a.md': fixture(1),
      'content/reactjs/c.md': fixture(3),
    })

    expect(index.reactjs.map((lesson) => lesson.order)).toEqual([1, 2, 3])
    expect(index['aws-saa-c03']).toEqual([])
    expect(findLesson(index, 'reactjs', 'c')?.title).toBe('Lesson 3')
    expect(findLesson(index, 'reactjs', 'nope')).toBeUndefined()
  })
})
