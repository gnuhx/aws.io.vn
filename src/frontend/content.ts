export type LessonEntry = {
  topic: string
  slug: string
  title: string
  summary: string
  order: number
  module?: {
    slug: string
    title: string
    order: number
  }
  kind?: 'lesson' | 'section'
  interactiveHtmlUrl?: string
  filePath: string
  source: 'markdown' | 'html'
  bodyHtml: string
}

const rawContentModules = import.meta.glob([
  '../../content/**/*.md',
  '!../../content/aws-saa-c03/roadmap.md',
  '!../../content/aws-saa-c03/Module 2/prompt_template.md',
  '!../../content/aws-saa-c03/Module [3-7]/**',
], {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

const module2HtmlAssets = import.meta.glob('../../content/aws-saa-c03/Module 2/*.html', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

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

const inlineMarkdown = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')

const markdownToHtml = (markdown: string) => {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean)
  const htmlParts: string[] = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    if (/^```/.test(trimmed)) {
      const fence = trimmed.match(/^```([^\n]*)\n?([\s\S]*?)\n?```$/)
      const language = fence?.[1].trim().split(/\s+/)[0] ?? ''
      const code = fence?.[2] ?? trimmed.replace(/^```[^\n]*\n?|```$/g, '')
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      htmlParts.push(`<pre><code${language ? ` class="language-${language}"` : ''}>${escapedCode}</code></pre>`)
      continue
    }

    if (/^>\s/.test(trimmed)) {
      htmlParts.push(`<blockquote>${inlineMarkdown(trimmed.replace(/^>\s?/gm, ''))}</blockquote>`)
      continue
    }

    if (/^[-*]\s/.test(trimmed)) {
      const listItems = trimmed
        .split(/\n/)
        .filter((line) => /^[-*]\s/.test(line.trim()))
        .map((line) => `<li>${inlineMarkdown(line.replace(/^[-*]\s?/, ''))}</li>`)
        .join('')
      htmlParts.push(`<ul>${listItems}</ul>`)
      continue
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,3}\s/, '')
      const level = trimmed.match(/^#+/)?.[0].length ?? 1
      htmlParts.push(`<h${level}>${inlineMarkdown(heading)}</h${level}>`)
      continue
    }

    htmlParts.push(`<p>${inlineMarkdown(trimmed)}</p>`)
  }

  return htmlParts.join('')
}

const parseLessonEntry = (filePath: string, raw: string): LessonEntry | null => {
  const relativePath = filePath.split('/content/')[1]
  const topic = relativePath?.split('/')[0]
  if (!relativePath || !topic) return null

  const filename = filePath.split('/').pop() ?? ''
  const directoryModule = relativePath.match(/(?:^|\/)module[\s_-]*(\d+)(?:\/|$)/i)
  const frontMatterModule = getFrontMatterValue(raw, 'module')
  const moduleOrder = frontMatterModule ? Number(frontMatterModule) : Number(directoryModule?.[1])
  const moduleTitle = getFrontMatterValue(raw, 'moduleTitle')
  const baseSlug = normalizeSlug(filename)
  const slug = getFrontMatterValue(raw, 'slug') ?? (Number.isFinite(moduleOrder) && moduleOrder > 0
    ? `module-${moduleOrder}-${baseSlug}`
    : baseSlug)
  const module = Number.isFinite(moduleOrder) && moduleOrder > 0
    ? {
        slug: `module-${moduleOrder}`,
        title: moduleTitle ?? `Module ${moduleOrder}`,
        order: moduleOrder,
      }
    : undefined
  const rawTitle = getFrontMatterValue(raw, 'title') ??
    raw.match(/<title>([^<]+)<\/title>/i)?.[1] ??
    filename.replace(/\.[^.]+$/, '').replace(/^[0-9]+[-_\s]*/, '')
  const title = rawTitle.trim() || 'Untitled lesson'
  const source = filePath.endsWith('.html') ? 'html' : 'markdown'
  const interactiveHtmlUrl = moduleOrder === 2 ? module2HtmlAssets[filePath.replace(/\.md$/, '.html')] : undefined
  const kind = getFrontMatterValue(raw, 'kind') === 'section' || interactiveHtmlUrl ? 'section' : 'lesson'
  const body = source === 'html'
    ? raw
    : raw.replace(/^---[\s\S]*?---\n?/, '').replace(/^#\s+[^\n]+\n+/, '').trim()
  const bodyHtml = source === 'html' ? raw : markdownToHtml(body)

  return {
    topic: normalizeTopic(topic),
    slug,
    title,
    summary: parseSummary(raw),
    order: parseOrder(filePath, raw),
    module,
    kind,
    interactiveHtmlUrl,
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
    const relativePath = filePath.split('/content/')[1] ?? ''
    const moduleFolder = relativePath.match(/^aws-saa-c03\/Module (\d+)\//)
    if (relativePath === 'aws-saa-c03/roadmap.md' || relativePath === 'aws-saa-c03/Module 2/prompt_template.md') continue
    if (moduleFolder && Number(moduleFolder[1]) > 2) continue
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
