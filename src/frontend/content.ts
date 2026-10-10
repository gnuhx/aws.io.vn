export type LessonKind = 'lesson' | 'section' | 'overview' | 'visual'

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
  kind: LessonKind
  interactiveHtmlUrl?: string
  markdownUrl?: string
  filePath: string
  source: 'markdown' | 'html'
  bodyMarkdown: string
}

const rawContentModules = import.meta.glob([
  '../../content/**/*.md',
  '!../../content/aws-saa-c03/roadmap.md',
  '!../../content/aws-saa-c03/Module */**',
  '!../../content/MCP/roadmap.md',
], {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

const roadmapRawModule = import.meta.glob('../../content/aws-saa-c03/roadmap.md', {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

const mcpRoadmapRawModule = import.meta.glob('../../content/MCP/roadmap.md', {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

const mcpHtmlAssets = import.meta.glob('../../content/MCP/**/*.html', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const courseHtmlAssets = import.meta.glob([
  '../../content/aws-saa-c03/Module */*.html',
  '!../../content/aws-saa-c03/Module 3/**',
], {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const examHtmlAssets = import.meta.glob('../../content/aws-saa-c03/Tests/SAA-C03_hardmode_exam_v*.html', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export type PracticeExam = { id: number; title: string; description: string; url: string; attempts: string; yesterdayHigh: number }

const sampleExamStats: Record<number, { attempts: string; yesterdayHigh: number }> = {
  2: { attempts: '1,284', yesterdayHigh: 88 },
  3: { attempts: '936', yesterdayHigh: 92 },
  4: { attempts: '1,108', yesterdayHigh: 84 },
  5: { attempts: '847', yesterdayHigh: 90 },
  6: { attempts: '1,452', yesterdayHigh: 86 },
  7: { attempts: '763', yesterdayHigh: 94 },
  8: { attempts: '1,016', yesterdayHigh: 89 },
  9: { attempts: '688', yesterdayHigh: 91 },
  10: { attempts: '529', yesterdayHigh: 87 },
}

export const getPracticeExams = (): PracticeExam[] =>
  Array.from({ length: 9 }, (_, index) => index + 2)
    .map((id) => {
      const path = `../../content/aws-saa-c03/Tests/SAA-C03_hardmode_exam_v${id}.html`
      const url = examHtmlAssets[path]
      return url ? { id, title: `Hardmode practice exam ${String(id).padStart(2, '0')}`, description: 'Timed practice with answer review and domain breakdown.', url, ...sampleExamStats[id] } : null
    })
    .filter((exam): exam is PracticeExam => exam !== null)

const courseMarkdownAssets = import.meta.glob([
  '../../content/aws-saa-c03/Module */*.md',
  '!../../content/aws-saa-c03/Module 2/prompt_template.md',
  '!../../content/aws-saa-c03/Module 3/**',
  '!../../content/aws-saa-c03/Module 5/SAA-C03_m5_danh-sach-bai.md',
], {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const moduleTitles: Record<number, string> = {
  1: 'Identity and Access Management',
  2: 'Compute & Identity Foundations',
  3: 'Networking',
  4: 'Storage & Database',
  5: 'Modern Architecture',
  6: 'Operations, Security & Management',
  7: 'Scale & Final Review',
}

const mcpModuleTitles: Record<number, string> = {
  1: 'React & UI',
  2: 'Walking skeleton',
  3: 'MCP: Tools',
  4: 'MCP: Resources & Prompts',
  5: 'MCP with real data',
  6: 'MCP client & agent',
  7: 'Remote MCP, Auth & Deploy',
}

const rootModuleNumbers: Record<string, number> = {
  '02-vpc-networking.md': 3,
  '03-compute-and-ecs.md': 2,
  '04-storage-and-database.md': 4,
  '05-security-and-operations.md': 6,
  '06-migration-and-transfer.md': 7,
  '07-cost-optimization.md': 7,
  '08-disaster-recovery-and-high-availability.md': 6,
  '09-load-balancing-and-auto-scaling.md': 2,
  '10-serverless-architectures.md': 5,
  '11-monitoring-and-observability.md': 6,
  '12-final-architecture-review.md': 7,
}

const standaloneHtmlMaterials = [
  { path: '../../content/aws-saa-c03/Module 4/luong-request.html', title: 'Request Flow: Mobile App to EC2, ElastiCache, and RDS', summary: 'Interactive architecture walkthrough for the request path.', order: 53, module: 4 },
  { path: '../../content/aws-saa-c03/Module 4/scaling-elasticache.html', title: 'Scaling ElastiCache', summary: 'Interactive comparison of ElastiCache scaling patterns.', order: 54, module: 4 },
  { path: '../../content/aws-saa-c03/Module 4/dynamodb-suite.html', title: 'DynamoDB Interactive Suite', summary: 'Interactive diagrams for DynamoDB, Streams, DAX, and Global Tables.', order: 55, module: 4 },
  { path: '../../content/aws-saa-c03/Module 4/data-analytics-suite.html', title: 'Data and Analytics Suite', summary: 'Interactive map of analytics services and data flows.', order: 61, module: 4 },
  { path: '../../content/aws-saa-c03/Module 5/SAA-C03_nha-may-nen_module5.html', title: 'Module 5 Architecture Map', summary: 'Interactive architecture map that carries the course system model forward.', order: 90, module: 5 },
  { path: '../../content/aws-saa-c03/Module 7/SAA-C03_nha-may-nen-tong-ket.html', title: 'Final Architecture Map', summary: 'Interactive cumulative architecture map for the completed course.', order: 100, module: 7 },
] as const

const courseSections = [
  { path: '../../content/aws-saa-c03/Module 2/SAA-C03_m2_ec2_p1_lpic.md', title: 'EC2 Core & Networking', summary: 'EC2 fundamentals, networking, addressing, and private subnet patterns.', slug: 'ec2-core-networking', order: 17, module: 2 },
  { path: '../../content/aws-saa-c03/Module 2/SAA-C03_m2_ec2_p2_lpic.md', title: 'EC2 Lifecycle & Pricing', summary: 'Instance lifecycle, Nitro, and EC2 purchasing options.', slug: 'ec2-lifecycle-pricing', order: 36, module: 2 },
  { path: '../../content/aws-saa-c03/Module 2/SAA-C03_m2_elb_asg_lpic.md', title: 'Elastic Load Balancing and Auto Scaling', summary: 'Load balancing, scaling policies, availability, and secure listeners.', slug: 'elastic-load-balancing-auto-scaling', order: 44, module: 2 },
  { path: '../../content/aws-saa-c03/Module 4/SAA-C03_m4_tai-lieu-hoc-day-du.md', title: 'Database and Analytics', summary: 'Course notes covering ElastiCache, DynamoDB, analytics, and related services.', slug: 'database-and-analytics', order: 53, module: 4 },
  { path: '../../content/aws-saa-c03/Module 5/SAA-C03_m5_docker-ecs.md', title: 'Docker Containers and ECS', summary: 'Containers, ECS, EKS, ECR, and container architecture patterns.', slug: 'docker-containers-ecs', order: 1, module: 5 },
  { path: '../../content/aws-saa-c03/Module 5/SAA-C03_m5_serverless.md', title: 'Serverless Applications', summary: 'Lambda, application integration, Step Functions, EventBridge, and API Gateway.', slug: 'serverless-applications', order: 15, module: 5 },
  { path: '../../content/aws-saa-c03/Module 6/SAA-C03_m6_deployment-management.md', title: 'Deployment and Management', summary: 'Infrastructure as code, deployment platforms, configuration, secrets, and recovery.', slug: 'deployment-management', order: 1, module: 6 },
  { path: '../../content/aws-saa-c03/Module 6/SAA-C03_m6_monitoring-logging-auditing.md', title: 'Monitoring, Logging, and Auditing', summary: 'CloudWatch, CloudTrail, EventBridge, metrics, logs, and tracing.', slug: 'monitoring-logging-auditing', order: 18, module: 6 },
  { path: '../../content/aws-saa-c03/Module 6/SAA-C03_m6_security.md', title: 'Security', summary: 'Identity, federation, encryption, certificates, threat detection, and defense in depth.', slug: 'security', order: 32, module: 6 },
  { path: '../../content/aws-saa-c03/Module 7/SAA-C03_m7_migration-transfer.md', title: 'Migration and Transfer', summary: 'Migration services, data transfer, Snow Family, and the 7 Rs.', slug: 'migration-transfer', order: 1, module: 7 },
  { path: '../../content/aws-saa-c03/Module 7/SAA-C03_m7_web-mobile-ml-cost.md', title: 'Web, Mobile, ML, and Cost Management', summary: 'Application services, AI tools, budgets, and cost optimization.', slug: 'web-mobile-ml-cost', order: 13, module: 7 },
  { path: '../../content/aws-saa-c03/Module 7/SAA-C03_m7_practice-exam-final-prep.md', title: 'Practice Exam and Final Preparation', summary: 'Practice-exam strategy and final review guidance.', slug: 'practice-exam-final-preparation', order: 25, module: 7 },
] as const

const readRawContent = (value: unknown) => {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    const candidate = value as { default?: unknown }
    if (typeof candidate.default === 'string') return candidate.default
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
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return undefined

  const keyMatch = match[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return keyMatch?.[1].trim().replace(/^['"]|['"]$/g, '')
}

const parseOrder = (filePath: string, raw: string) => {
  const frontMatterOrder = getFrontMatterValue(raw, 'order')
  if (frontMatterOrder !== undefined) {
    const parsed = Number(frontMatterOrder)
    if (!Number.isNaN(parsed)) return parsed
  }

  const filename = filePath.split('/').pop() ?? ''
  if (/^Module-\d+/i.test(filename)) return 0
  const session = filename.match(/^S\d+\.(\d+)/i)
  if (session) return Number(session[1])

  const lecture = raw.match(/\b[2-7]\.(\d+)\b/)
  if (lecture) return Number(lecture[1])

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

const parseLessonEntry = (filePath: string, raw: string): LessonEntry | null => {
  const relativePath = filePath.split('/content/')[1]
  const topic = relativePath?.split('/')[0]
  if (!relativePath || !topic) return null

  const filename = filePath.split('/').pop() ?? ''
  const directoryModule = relativePath.match(/(?:^|\/)module[\s_-]*(\d+)(?:\/|$)/i)
  const frontMatterModule = getFrontMatterValue(raw, 'module')
  const rootModule = rootModuleNumbers[filename]
  const moduleOrder = frontMatterModule
    ? Number(frontMatterModule)
    : Number(directoryModule?.[1] ?? rootModuleNumbers[filename])
  const moduleTitle = getFrontMatterValue(raw, 'moduleTitle')
  const baseSlug = normalizeSlug(filename)
  const slug = getFrontMatterValue(raw, 'slug') ?? (Number.isFinite(moduleOrder) && moduleOrder > 0
    ? `module-${moduleOrder}-${baseSlug}`
    : baseSlug)
  const module = Number.isFinite(moduleOrder) && moduleOrder > 0
    ? {
        slug: `module-${moduleOrder}`,
        title: moduleTitle ?? (topic === 'MCP' ? mcpModuleTitles[moduleOrder] : moduleTitles[moduleOrder]) ?? `Module ${moduleOrder}`,
        order: moduleOrder,
      }
    : undefined
  const rawTitle = getFrontMatterValue(raw, 'title') ??
    (topic === 'MCP' ? raw.match(/^#\s+([^\n]+)/m)?.[1]?.replace(/^Module\s+\d+\s*[—–-]\s*/i, '') : undefined) ??
    raw.match(/<title>([^<]+)<\/title>/i)?.[1] ??
    filename.replace(/\.[^.]+$/, '').replace(/^[0-9]+[-_\s]*/, '')
  const title = rawTitle.trim() || 'Untitled lesson'
  const bodyMarkdown = raw
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^#\s+[^\n]+\n+/, '')
    .trim()
  const kind: LessonKind = getFrontMatterValue(raw, 'kind') === 'overview' || rootModule || (topic === 'MCP' && /^Module-\d+/i.test(filename))
    ? 'overview'
    : 'lesson'

  return {
    topic: normalizeTopic(topic),
    slug,
    title,
    summary: parseSummary(raw),
    order: parseOrder(filePath, raw),
    module,
    kind,
    interactiveHtmlUrl: topic === 'MCP' ? mcpHtmlAssets[filePath.replace(/\.md$/, '.html')] : undefined,
    filePath,
    source: 'markdown',
    bodyMarkdown,
  }
}

let lessonCatalogCache: Record<string, LessonEntry[]> | null = null

export const getLessonCatalog = () => {
  if (lessonCatalogCache) return lessonCatalogCache

  const catalog: Record<string, LessonEntry[]> = {}
  for (const [filePath, rawFile] of Object.entries(rawContentModules)) {
    const relativePath = filePath.split('/content/')[1] ?? ''
    if (relativePath === 'aws-saa-c03/Module 5/SAA-C03_m5_danh-sach-bai.md') continue

    const rawContent = readRawContent(rawFile)
    if (!rawContent) continue

    const lesson = parseLessonEntry(filePath, rawContent)
    if (!lesson) continue
    catalog[lesson.topic] ??= []
    catalog[lesson.topic].push(lesson)
  }

  for (const section of courseSections) {
    const markdownUrl = courseMarkdownAssets[section.path]
    if (!markdownUrl) continue

    const lesson: LessonEntry = {
      topic: 'aws-saa-c03',
      slug: `module-${section.module}-${section.slug}`,
      title: section.title,
      summary: section.summary,
      order: section.order,
      module: {
        slug: `module-${section.module}`,
        title: moduleTitles[section.module],
        order: section.module,
      },
      kind: 'section',
      interactiveHtmlUrl: courseHtmlAssets[section.path.replace(/\.md$/, '.html')],
      markdownUrl,
      filePath: section.path,
      source: 'markdown',
      bodyMarkdown: '',
    }
    catalog['aws-saa-c03'] ??= []
    catalog['aws-saa-c03'].push(lesson)
  }

  for (const material of standaloneHtmlMaterials) {
    const url = courseHtmlAssets[material.path]
    if (!url) continue

    const lesson: LessonEntry = {
      topic: 'aws-saa-c03',
      slug: `module-${material.module}-${normalizeSlug(material.title)}`,
      title: material.title,
      summary: material.summary,
      order: material.order,
      module: {
        slug: `module-${material.module}`,
        title: moduleTitles[material.module],
        order: material.module,
      },
      kind: 'visual',
      interactiveHtmlUrl: url,
      filePath: material.path,
      source: 'html',
      bodyMarkdown: '',
    }
    catalog['aws-saa-c03'] ??= []
    catalog['aws-saa-c03'].push(lesson)
  }

  Object.values(catalog).forEach((lessons) => lessons.sort((a, b) => a.order - b.order))
  lessonCatalogCache = catalog
  return lessonCatalogCache
}

export const getTopicLabel = (topic: string) => {
  const topicMap: Record<string, string> = {
    'aws-saa-c03': 'AWS SAA-C03',
    MCP: 'Node.js MCP Server Learning Course',
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
    label: getTopicLabel(topic),
    lessons,
  }))
}

export const findLesson = (topic: string, slug: string) => {
  const lesson = getLessonCatalog()[topic]?.find((entry) => entry.slug === slug)
  return lesson ?? null
}

export const getCourseRoadmap = (topic = 'aws-saa-c03') => readRawContent(
  Object.values(topic === 'MCP' ? mcpRoadmapRawModule : roadmapRawModule)[0],
)

export const getPublishedModuleOrders = (topic: string) =>
  [...new Set((getLessonCatalog()[topic] ?? []).map((lesson) => lesson.module?.order).filter((order): order is number => order !== undefined))]
    .sort((a, b) => a - b)
