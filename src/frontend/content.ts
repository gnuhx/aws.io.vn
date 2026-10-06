export type LessonEntry = {
  topic: string
  slug: string
  title: string
  summary: string
  order: number
  filePath: string
  source: 'markdown' | 'html'
  bodyHtml: string
}

const rawContentModules = import.meta.glob('../../content/**/*.{md,html}', {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

const readRawContent = (value: unknown) => {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    const candidate = value as { default?: unknown }
    if (typeof candidate.default === 'string') {
      return candidate.default
    }
  }

  return ''
}

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[-_\s]+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeTopic = (value: string) => value.trim().replace(/\s+/g, '-')

const getFrontMatterValue = (raw: string, key: string) => {
  const match = raw.match(new RegExp(`^---\\n([\\s\\S]*?)\\n---\\n?`, 'm'))
  if (!match) return undefined

  const frontMatter = match[1]
  const keyMatch = frontMatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  if (!keyMatch) return undefined

  return keyMatch[1].trim().replace(/^['"]|['"]$/g, '')
}

const parseOrder = (filePath: string, raw: string) => {
  const frontMatterOrder = getFrontMatterValue(raw, 'order')
  if (frontMatterOrder) {
    const parsed = Number(frontMatterOrder)
    if (!Number.isNaN(parsed)) return parsed
  }

  const filename = filePath.split('/').pop() ?? ''
  const match = filename.match(/^(\d+)/)
  return match ? Number(match[1]) : 999
}

const stripHtml = (value: string) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const parseSummary = (raw: string) => {
  const normalized = raw.replace(/^---[\s\S]*?---\n?/, '').trim()
  if (!normalized) return 'Lesson overview'

  const lines = normalized.split(/\n+/)
  const firstMeaningful = lines.find((line) => line.trim() && !line.startsWith('#'))
  if (!firstMeaningful) return 'Lesson overview'

  return stripHtml(firstMeaningful).slice(0, 160)
}

const markdownToHtml = (markdown: string) => {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean)
  const htmlParts: string[] = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    if (/^```/.test(trimmed)) {
      const code = trimmed.replace(/^```[a-zA-Z]*\n?|```$/g, '')
      htmlParts.push(`<pre><code>${code}</code></pre>`)
      continue
    }

    if (/^>\s/.test(trimmed)) {
      htmlParts.push(`<blockquote>${trimmed.replace(/^>\s?/gm, '')}</blockquote>`)
      continue
    }

    if (/^[-*]\s/.test(trimmed)) {
      const listItems = trimmed
        .split(/\n/)
        .filter((line) => /^[-*]\s/.test(line.trim()))
        .map((line) => `<li>${line.replace(/^[-*]\s?/, '')}</li>`)
        .join('')
      htmlParts.push(`<ul>${listItems}</ul>`)
      continue
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,3}\s/, '')
      const level = trimmed.match(/^#+/)?.[0].length ?? 1
      htmlParts.push(`<h${level}>${heading}</h${level}>`)
      continue
    }

    htmlParts.push(`<p>${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`)
  }

  return htmlParts.join('')
}

const parseLessonEntry = (filePath: string, raw: string): LessonEntry | null => {
  const topic = filePath.split('/content/')[1]?.split('/')[0]
  if (!topic) return null

  const filename = filePath.split('/').pop() ?? ''
  const slug = normalizeSlug(filename)
  const rawTitle = getFrontMatterValue(raw, 'title') ??
    raw.match(/<title>([^<]+)<\/title>/i)?.[1] ??
    filename.replace(/\.[^.]+$/, '').replace(/^[0-9]+[-_\s]*/, '')
  const title = rawTitle.trim() || 'Untitled lesson'
  const source = filePath.endsWith('.html') ? 'html' : 'markdown'
  const body = source === 'html' ? raw : raw.replace(/^---[\s\S]*?---\n?/, '').trim()
  const bodyHtml = source === 'html' ? raw : markdownToHtml(body)

  return {
    topic: normalizeTopic(topic),
    slug,
    title,
    summary: parseSummary(raw),
    order: parseOrder(filePath, raw),
    filePath,
    source,
    bodyHtml,
  }
}

let lessonCatalogCache: Record<string, LessonEntry[]> | null = null

export const getLessonCatalog = () => {
  if (lessonCatalogCache) {
    return lessonCatalogCache
  }

  const catalog: Record<string, LessonEntry[]> = {}

  for (const [filePath, rawFile] of Object.entries(rawContentModules)) {
    const rawContent = readRawContent(rawFile)
    if (!rawContent) continue

    const lesson = parseLessonEntry(filePath, rawContent)
    if (!lesson) continue

    if (!catalog[lesson.topic]) {
      catalog[lesson.topic] = []
    }

    catalog[lesson.topic].push(lesson)
  }

  Object.keys(catalog).forEach((topic) => {
    catalog[topic].sort((a, b) => a.order - b.order)
  })

  lessonCatalogCache = catalog
  return lessonCatalogCache
}

const formatTopicLabel = (topic: string) => {
  const topicMap: Record<string, string> = {
    'aws-saa-c03': 'AWS SAA-C03',
    'context-engineering': 'Context Engineering',
    reactjs: 'ReactJS',
    'agentic-ai-code': 'Agentic AI Code',
  }

  return topicMap[topic] ?? topic.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export const getTopics = () => {
  const catalog = getLessonCatalog()
  return Object.entries(catalog).map(([topic, lessons]) => ({
    topic,
    label: formatTopicLabel(topic),
    lessons,
  }))
}

export const findLesson = (topic: string, slug: string) => {
  const lesson = getLessonCatalog()[topic]?.find((entry) => entry.slug === slug)
  return lesson ?? null
}
