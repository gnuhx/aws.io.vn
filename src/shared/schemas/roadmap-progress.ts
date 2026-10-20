import { z } from 'zod'

import { isLessonProgressId } from '../lessonProgress.ts'
import { isRoadmapId, isRoadmapItemId, type ProgressStatus } from '../roadmapProgress.ts'

export const roadmapIdSchema = z.enum(['aws-saa-c03', 'MCP', 'reactjs'])
export const progressStatusSchema = z.enum(['in_progress', 'completed'])

export const progressReadParamsSchema = z.object({ roadmapId: roadmapIdSchema })

export const progressUpdateSchema = z.object({
  roadmapId: roadmapIdSchema,
  itemId: z.string().min(1).max(100),
  status: progressStatusSchema,
}).strict()

export const progressDeleteSchema = z.object({
  roadmapId: roadmapIdSchema,
  itemId: z.string().min(1).max(100),
}).strict()

// Bulk "mark read" for a module's lessons. Lesson IDs only: roadmap items keep their one-at-a-time PUT.
export const lessonsReadSchema = z.object({
  roadmapId: roadmapIdSchema,
  lessonIds: z.array(z.string().min(1).max(100)).min(1).max(200),
}).strict()

// Roadmap items and published lessons share one ID space per roadmap (see lessonProgress.ts).
export const isTrackableProgressItem = (roadmapId: string, itemId: string) =>
  isRoadmapId(roadmapId) && (isRoadmapItemId(roadmapId, itemId) || isLessonProgressId(roadmapId, itemId))

// A lesson is either read (`completed`) or not; it has no `in_progress` state.
export const isAllowedProgressStatus = (roadmapId: string, itemId: string, status: ProgressStatus) =>
  isRoadmapId(roadmapId) && (isRoadmapItemId(roadmapId, itemId) || (isLessonProgressId(roadmapId, itemId) && status === 'completed'))
