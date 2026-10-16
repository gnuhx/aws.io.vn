import type { ProgressStatus } from '../../shared/roadmapProgress.ts'
import * as repository from '../repositories/progress.ts'

export { listActivity, listStatuses } from '../repositories/progress.ts'

// The activity log only feeds the learning calendar: losing one event must not fail a saved status change.
async function logActivity(userId: string, roadmapId: string, itemId: string, status: ProgressStatus | 'not_started') {
  try {
    await repository.recordActivity(userId, roadmapId, itemId, status)
  } catch (cause) {
    console.error('Could not record progress activity', cause)
  }
}

export async function setStatus(userId: string, roadmapId: string, itemId: string, status: ProgressStatus) {
  await repository.setStatus(userId, roadmapId, itemId, status)
  await logActivity(userId, roadmapId, itemId, status)
}

/** Marks lessons read. Already-read lessons are left as they are and logged only once, so a retry is safe. */
export async function markLessonsRead(userId: string, roadmapId: string, lessonIds: readonly string[]) {
  const added = await repository.insertCompleted(userId, roadmapId, [...new Set(lessonIds)])
  for (const lessonId of added) await logActivity(userId, roadmapId, lessonId, 'completed')
}

export async function clearStatus(userId: string, roadmapId: string, itemId: string) {
  await repository.clearStatus(userId, roadmapId, itemId)
  await logActivity(userId, roadmapId, itemId, 'not_started')
}
