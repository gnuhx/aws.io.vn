import { describe, expect, it } from 'vitest'
import { lessonProgressManifest } from './lessonProgress.ts'
import { isRoadmapItemId, type RoadmapId } from './roadmapProgress.ts'

describe('lessonProgressManifest', () => {
  for (const [roadmapId, lessons] of Object.entries(lessonProgressManifest) as [RoadmapId, typeof lessonProgressManifest[RoadmapId]][]) {
    it(`${roadmapId}: IDs are unique, scoped to the roadmap and never collide with roadmap items`, () => {
      const ids = lessons.map((lesson) => lesson.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) {
        expect(id).toMatch(new RegExp(`^${roadmapId}:lesson-\\d{4}$`))
        expect(isRoadmapItemId(roadmapId, id)).toBe(false)
      }
    })

    it(`${roadmapId}: every lesson points at a real roadmap item and a unique file in that course`, () => {
      const paths = lessons.map((lesson) => lesson.path)
      expect(new Set(paths).size).toBe(paths.length)
      for (const lesson of lessons) {
        expect(lesson.path.startsWith(`${roadmapId}/`)).toBe(true)
        expect(isRoadmapItemId(roadmapId, lesson.roadmapItemId)).toBe(true)
      }
    })
  }
})
