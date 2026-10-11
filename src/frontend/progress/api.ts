import type { ProgressStatus, RoadmapId } from '../../shared/roadmapProgress.ts'
import { ApiError } from '../auth/api.ts'

/** Saved statuses for one roadmap, keyed by roadmap item ID or lesson ID. Missing = not started / unread. */
export type SavedStatuses = Record<string, ProgressStatus>

/** One saved status change, for the learning calendar. `at` is an ISO timestamp (UTC). */
export type ActivityEvent = { itemId: string; status: ProgressStatus | 'not_started'; at: string }

// Same-origin requests send the httpOnly session cookie; the server derives the owner from it.
async function request<T>(roadmapId: RoadmapId, init: RequestInit = {}, suffix = ''): Promise<T> {
  const response = await fetch(`/api/progress/${encodeURIComponent(roadmapId)}${suffix}`, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json' } : init.headers,
  })
  const body = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new ApiError(response.status, body.error ?? 'Something went wrong. Try again.')
  return body
}

export const progressApi = {
  list: (roadmapId: RoadmapId) =>
    request<{ statuses?: SavedStatuses }>(roadmapId).then((body) => body.statuses ?? {}),
  /** `not_started` deletes the saved record (also how a lesson is marked unread). */
  save: (roadmapId: RoadmapId, itemId: string, status: ProgressStatus | 'not_started') =>
    request<unknown>(roadmapId, status === 'not_started'
      ? { method: 'DELETE', body: JSON.stringify({ itemId }) }
      : { method: 'PUT', body: JSON.stringify({ itemId, status }) }),
  /** Status changes from the last year, newest first. */
  activity: (roadmapId: RoadmapId) =>
    request<{ activity?: ActivityEvent[] }>(roadmapId, {}, '/activity').then((body) => body.activity ?? []),
}
