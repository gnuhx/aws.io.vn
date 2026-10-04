import { parse as parseYaml } from 'yaml'
import {
  lessonFrontmatterSchema,
  TOPICS,
  type LessonFrontmatter,
  type Topic,
} from '../schemas/lesson.ts'

// Pure string parsing, no Node APIs: this runs in the browser bundle (gray-matter would not).

export type Lesson = LessonFrontmatter & {
  slug: string
  body: string
}

export type LessonIndex = Record<Topic, Lesson[]>

export class LessonParseError extends Error {
  constructor(path: string, problems: string[]) {
    super(`${path}: ${problems.join('; ')}`)
    this.name = 'LessonParseError'
  }
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/

/** Parses `content/<topic>/<slug>.md`. Throws a LessonParseError naming the file and field. */
export function parseLesson(path: string, raw: string): Lesson {
  const segments = path.split('/')
  const folder = segments.at(-2) ?? ''
  const slug = (segments.at(-1) ?? '').replace(/\.md$/, '')

  const match = FRONTMATTER.exec(raw)
  if (!match) throw new LessonParseError(path, ['missing frontmatter block'])

  let data: unknown
  try {
    data = parseYaml(match[1])
  } catch (error) {
    throw new LessonParseError(path, [`invalid YAML: ${(error as Error).message}`])
  }

  const result = lessonFrontmatterSchema.safeParse(data ?? {})
  if (!result.success) {
    throw new LessonParseError(
      path,
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    )
  }
  if (result.data.topic !== folder) {
    throw new LessonParseError(path, [
      `topic: "${result.data.topic}" does not match folder "${folder}"`,
    ])
  }

  return { ...result.data, slug, body: match[2] }
}

/** Parses every file and groups lessons by topic, sorted by `order`. Keys are file paths. */
export function buildLessonIndex(files: Record<string, string>): LessonIndex {
  const index = Object.fromEntries(TOPICS.map((topic) => [topic, [] as Lesson[]])) as LessonIndex
  for (const [path, raw] of Object.entries(files)) {
    const lesson = parseLesson(path, raw)
    index[lesson.topic].push(lesson)
  }
  for (const lessons of Object.values(index)) {
    lessons.sort((a, b) => a.order - b.order)
  }
  return index
}

export function findLesson(index: LessonIndex, topic: Topic, slug: string): Lesson | undefined {
  return index[topic].find((lesson) => lesson.slug === slug)
}
