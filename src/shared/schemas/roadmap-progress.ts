import { z } from 'zod'

import { isRoadmapId, isRoadmapItemId } from '../roadmapProgress.ts'

export const roadmapIdSchema = z.enum(['aws-saa-c03', 'MCP'])
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

export const isTrackableProgressItem = (roadmapId: string, itemId: string) =>
  isRoadmapId(roadmapId) && isRoadmapItemId(roadmapId, itemId)
