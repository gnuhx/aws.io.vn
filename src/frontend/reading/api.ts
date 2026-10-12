import type { ReadingPosition, ReadingPositionInput } from '../../shared/schemas/reading.ts'
import { request } from '../auth/api.ts'

const url = (topic: string) => `/api/reading/${encodeURIComponent(topic)}`

export const readingApi = {
  url,
  /** The course's last read lesson + section, or null. */
  get: (topic: string) => request<{ position: ReadingPosition | null }>(url(topic)).then((body) => body.position),
  save: (topic: string, position: ReadingPositionInput, { keepalive = false } = {}) =>
    request<{ saved: boolean }>(url(topic), { method: 'PUT', body: JSON.stringify(position), keepalive }),
}
