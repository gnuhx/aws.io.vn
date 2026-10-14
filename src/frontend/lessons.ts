import { buildLessonIndex } from '@shared/lessons/parse.ts'

// Vite inlines every lesson as a string at build time; parsing uses only browser-safe code.
const files = import.meta.glob<string>('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const lessonIndex = buildLessonIndex(files)
