import { describe, expect, it } from 'vitest'
import { lessonProgressManifest } from '../shared/lessonProgress.ts'
import { roadmapProgressManifest, type RoadmapId } from '../shared/roadmapProgress.ts'
import { findLesson, getCourseRoadmap, getLessonCatalog, getLessonContentPath, getTrackedLessons } from './content.ts'

const roadmapIds = Object.keys(lessonProgressManifest) as RoadmapId[]

describe('roadmap progress manifest', () => {
  it.each(roadmapIds)('%s: every item points at a checklist line of the roadmap', (roadmapId) => {
    const lines = getCourseRoadmap(roadmapId).split('\n')
    const detached = roadmapProgressManifest[roadmapId].filter((item) => !/^\s*- \[[ x]\] /.test(lines[item.sourceLine - 1] ?? ''))
    expect(detached.map((item) => item.id)).toEqual([])
  })
})

describe('reactjs course', () => {
  it('serves each module page with its interactive lesson, module title and plain-text summary', () => {
    const lessons = getLessonCatalog().reactjs ?? []
    expect(lessons.map((lesson) => lesson.module?.order ?? 0).sort((a, b) => a - b)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1))
    for (const lesson of lessons) {
      expect(lesson.interactiveHtmlUrl).toBeDefined()
      expect(lesson.module?.title).not.toMatch(/^Module \d+$/)
      expect(lesson.title).not.toMatch(/^Module \d+/)
      expect(lesson.summary).not.toMatch(/^[_*>]/)
    }
  })
})

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
