import { describe, expect, it } from 'vitest'
import { lessonProgressManifest } from '../shared/lessonProgress.ts'
import { roadmapProgressManifest, type RoadmapId } from '../shared/roadmapProgress.ts'
import {
  findLesson,
  getCourseRoadmap,
  getLessonCatalog,
  getLessonContentPath,
  getPublishedModuleOrders,
  getTrackedLessons,
  groupLessonsBySection,
  parseChapterLesson,
  resolveLessonAssetUrl,
} from './content.ts'

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

describe('lesson slugs', () => {
  it('are unique within every topic', () => {
    for (const lessons of Object.values(getLessonCatalog())) {
      const slugs = lessons.map((lesson) => lesson.slug)
      expect(slugs.filter((slug, index) => slugs.indexOf(slug) !== index)).toEqual([])
    }
  })
})

describe('terraform course (chapter layout)', () => {
  const lessons = getLessonCatalog().terraform ?? []
  const path = '/repo/content/terraform/Chapter 01 - Understanding Terraform Architecture/2. Understanding Terraform State/1. Terraform State.md'

  it('takes module, section, order, slug and title from the path and heading', () => {
    expect(parseChapterLesson(path, '# Terraform State\n\nState maps configuration to real resources.')).toMatchObject({
      topic: 'terraform',
      slug: 'ch01-understanding-terraform-state-terraform-state',
      title: 'Terraform State',
      summary: 'State maps configuration to real resources.',
      order: 201,
      module: { slug: 'module-1', title: 'Understanding Terraform Architecture', order: 1 },
      section: { title: 'Understanding Terraform State', order: 2 },
      bodyMarkdown: 'State maps configuration to real resources.',
    })
  })

  it('never takes the order from version numbers in the text', () => {
    expect(parseChapterLesson(path, '# Terraform State\n\nUses version 1.2.6 of the plugin.')?.order).toBe(201)
  })

  it('serves 18 chapters as modules, with folder titles and no sample-code READMEs', () => {
    expect(getPublishedModuleOrders('terraform')).toEqual(Array.from({ length: 18 }, (_, index) => index + 1))
    expect(lessons.find((lesson) => lesson.module?.order === 6)?.module?.title).toBe('Understanding GitOps and CI/CD Deployment Patterns')
    expect(lessons.filter((lesson) => lesson.filePath.includes('/Code Files/'))).toEqual([])
    for (const lesson of lessons) {
      expect(lesson.title).not.toMatch(/^\d+\.\s/)
      expect(lesson.summary).not.toMatch(/^(!\[|```|\[)/)
    }
  })

  it('resolves every relative image to a bundled asset', () => {
    const unresolved = lessons.flatMap((lesson) =>
      [...lesson.bodyMarkdown.matchAll(/^\[[^\]]+\]:\s*(\.\.\/images\/\S+)/gm)]
        .map((match) => match[1])
        .filter((url) => resolveLessonAssetUrl(lesson, url) === url)
        .map((url) => `${getLessonContentPath(lesson)} → ${url}`))
    expect(unresolved).toEqual([])
  })

  it('leaves absolute and external URLs unchanged', () => {
    const lesson = { filePath: path }
    expect(resolveLessonAssetUrl(lesson, 'https://developer.hashicorp.com/terraform')).toBe('https://developer.hashicorp.com/terraform')
    expect(resolveLessonAssetUrl(lesson, '#state')).toBe('#state')
    expect(resolveLessonAssetUrl(lesson, '../images/does-not-exist.png')).toBe('../images/does-not-exist.png')
  })

  it('groups a module\'s lessons by section in order', () => {
    const chapter = lessons.filter((lesson) => lesson.module?.order === 1).sort((a, b) => a.order - b.order)
    expect(groupLessonsBySection(chapter).map((group) => group.section?.title)).toEqual([
      'Chapter Intro',
      'Understanding Terraform Architecture',
      'Understanding Terraform State',
      'Understanding How to Build and Consume Modules',
      'Understanding How to Effectively Use the CLI',
      'Chapter Summary',
    ])
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
