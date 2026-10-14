import { z } from 'zod'

// Shared by the reading tracker and /api/reading, so both sides accept the same IDs.

export const readingTopicSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)

/** Section IDs are heading slugs from rehypeHeadingIds: lowercase ASCII, digits and dashes. */
export const readingPositionSchema = z.object({
  lessonSlug: z.string().regex(/^[A-Za-z0-9._-]{1,150}$/),
  sectionId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/),
}).strict()

export type ReadingPositionInput = z.infer<typeof readingPositionSchema>
export type ReadingPosition = ReadingPositionInput & { updatedAt: string }
