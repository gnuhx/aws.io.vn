import { describe, expect, it } from 'vitest'
import { lessonProgressManifest } from '../shared/lessonProgress.ts'
import type { RoadmapId } from '../shared/roadmapProgress.ts'
import { findLesson, getLessonCatalog, getLessonContentPath, getTrackedLessons } from './content.ts'

const roadmapIds = Object.keys(lessonProgressManifest) as RoadmapId[]

describe('lesson read-tracking IDs', () => {
  it.each(roadmapIds)('%s: every lesson page has a tracking ID', (roadmapId) => {
    const trackedPaths = new Set(lessonProgressManifest[roadmapId].map((lesson) => lesson.path))
    const routable = (getLessonCatalog()[roadmapId] ?? []).filter((lesson) => findLesson(roadmapId, lesson.slug) === lesson)
    expect(routable.map(getLessonContentPath).filter((path) => !trackedPaths.has(path))).toEqual([])
  })

  it.each(roadmapIds)('%s: every tracking ID belongs to an existing lesson page', (roadmapId) => {
    const tracked = getTrackedLessons(roadmapId)
    expect(tracked.map((lesson) => lesson.id)).toEqual(lessonProgressManifest[roadmapId].map((lesson) => lesson.id))
    for (const lesson of tracked) {
      const [, topic, slug] = lesson.href.split('/')
      expect(findLesson(topic, slug)?.title).toBe(lesson.title)
    }
  })
})
