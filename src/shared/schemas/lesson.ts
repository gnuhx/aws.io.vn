import { z } from 'zod'

// The four course topics; each one is a folder in content/ and the first URL segment.
export const TOPICS = ['aws-saa-c03', 'context-engineering', 'reactjs', 'agentic-ai-code'] as const

export type Topic = (typeof TOPICS)[number]

export const TOPIC_LABELS: Record<Topic, string> = {
  'aws-saa-c03': 'AWS SAA-C03',
  'context-engineering': 'Context Engineering',
  reactjs: 'ReactJS',
  'agentic-ai-code': 'Agentic AI Code',
}

export function isTopic(value: string | undefined): value is Topic {
  return TOPICS.includes(value as Topic)
}

// Lesson frontmatter, see docs/LESSON_TEMPLATE.md.
export const lessonFrontmatterSchema = z.object({
  title: z.string().min(1),
  topic: z.enum(TOPICS),
  order: z.number().int(),
  date: z.iso.date(),
  tags: z.array(z.string()),
  domain: z.string().optional(),
})

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>
