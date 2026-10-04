import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseLesson } from '@shared/lessons/parse.ts'

function lessonPaths() {
  return readdirSync('content', { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.md'))
    .map((file) => `content/${file.replaceAll('\\', '/')}`)
}

// Content gate: every real lesson must match the frontmatter schema, or `npm run verify` fails.
describe('content/**/*.md', () => {
  it('every lesson passes the frontmatter schema', () => {
    const problems: string[] = []
    for (const path of lessonPaths()) {
      try {
        parseLesson(path, readFileSync(path, 'utf8'))
      } catch (error) {
        problems.push((error as Error).message)
      }
    }

    expect(problems).toEqual([])
  })
})
