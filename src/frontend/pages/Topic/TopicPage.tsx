import { Link, useParams } from 'react-router'
import { findLessonProgressEntry } from '../../../shared/lessonProgress.ts'
import { isRoadmapId } from '../../../shared/roadmapProgress.ts'
import { getLessonCatalog, getLessonContentPath, getPublishedModuleOrders, getTopicLabel, type LessonEntry } from '../../content.ts'
import { McpModuleWrapup } from '../../components/McpModuleWrapup/McpModuleWrapup.tsx'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import { ContinueReading } from '../../reading/ContinueReading.tsx'
import { ModuleReadAction } from './ModuleReadAction.tsx'
import { useLessonReadState } from './useLessonReadState.ts'
import styles from './TopicPage.module.css'

export function TopicPage() {
  const { topic = '' } = useParams()
  const lessons = getLessonCatalog()[topic] ?? []
  const roadmapId = isRoadmapId(topic) ? topic : null
  const readState = useLessonReadState(roadmapId)

  // Only lessons with a progress-manifest entry can be marked read; other materials are left out of the count.
  const trackedIds = (moduleLessons: LessonEntry[]) => roadmapId
    ? moduleLessons.flatMap((lesson) => findLessonProgressEntry(roadmapId, getLessonContentPath(lesson))?.id ?? [])
    : []

  if (!lessons.length) return <NotFoundPage />

  const modules = new Map<number, { title: string; lessons: typeof lessons }>()
  const unassignedLessons = lessons.filter((lesson) => !lesson.module)

  for (const lesson of lessons) {
    if (!lesson.module) continue
    const group = modules.get(lesson.module.order) ?? { title: lesson.module.title, lessons: [] }
    group.lessons.push(lesson)
    modules.set(lesson.module.order, group)
  }

  const sortedModules = [...modules.entries()].sort(([a], [b]) => a - b)
  const label = topic === 'aws-saa-c03' ? 'AWS Certified Solutions Architect — Associate' : getTopicLabel(topic)
  const publishedModules = getPublishedModuleOrders(topic)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} to="/">← All topics</Link>
        <p className={styles.eyebrow}>Learning path</p>
        <h1>{label}</h1>
        <p className={styles.intro}>{topic === 'MCP'
          ? 'Build a production-ready MCP server with Node.js and TypeScript, then connect it to a client and deploy it.'
          : topic === 'reactjs'
            ? 'From components and hooks to app state, data fetching, Next.js and reviewing AI-generated React code.'
            : 'A clear path through the concepts, one focused lesson at a time.'}</p>
        <div className={styles.courseMeta}>
          <span>{lessons.length} content pages</span>
          {sortedModules.length > 0 && <span>{sortedModules.length} {sortedModules.length === 1 ? 'module' : 'modules'}</span>}
        </div>
        <ContinueReading topic={topic} lessons={lessons} />
        {topic === 'aws-saa-c03' && (
          <Link className={styles.roadmapLink} to="/aws-saa-c03/roadmap">View full course roadmap ↗</Link>
        )}
        {topic === 'MCP' && (
          <>
            <p className={styles.publishStatus}>
              Published lessons: Modules {publishedModules.join(', ')}. The remaining modules are outlined in the roadmap.
            </p>
            <Link className={styles.roadmapLink} to="/MCP/roadmap">View the complete course roadmap ↗</Link>
          </>
        )}
        {topic === 'reactjs' && (
          <Link className={styles.roadmapLink} to="/reactjs/roadmap">View the complete course roadmap ↗</Link>
        )}
      </header>

      <div className={styles.curriculum}>
        {readState.loadError && (
          <p className={styles.progressError} role="alert">
            {readState.loadError}
            {readState.owner && <button type="button" onClick={readState.reload}>Retry</button>}
          </p>
        )}
        {sortedModules.map(([order, group]) => (
          <section className={styles.module} key={order}>
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>{String(order).padStart(2, '0')}</span>
              <div>
                <p className={styles.moduleKicker}>Module {order}</p>
                <h2>{group.title}</h2>
              </div>
              <div className={styles.moduleMeta}>
                <span className={styles.lessonCount}>{group.lessons.length} materials</span>
                <ModuleReadAction moduleName={`Module ${order}`} lessonIds={trackedIds(group.lessons)} state={readState} />
              </div>
            </div>
            <ol className={styles.lessonList}>
              {group.lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                <li key={lesson.slug}>
                  <Link className={styles.lessonLink} to={`/${topic}/${lesson.slug}`}>
                    <span className={styles.lessonIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.lessonCopy}>
                      <strong>{lesson.title}</strong>
                      <span>{lesson.kind === 'overview' ? 'Overview · ' : lesson.kind === 'visual' ? 'Interactive visual · ' : lesson.kind === 'section' ? 'Section · ' : 'Lesson · '}{lesson.summary}</span>
                    </span>
                    <span className={styles.arrow} aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
            {topic === 'MCP' && (
              <McpModuleWrapup
                module={order}
                codeUrl={group.lessons.find((lesson) => lesson.kind === 'overview')?.interactiveHtmlUrl}
              />
            )}
          </section>
        ))}

        {unassignedLessons.length > 0 && (
          <section className={styles.module}>
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>••</span>
              <div>
                <p className={styles.moduleKicker}>More lessons</p>
                <h2>Additional topics</h2>
              </div>
              <span className={styles.lessonCount}>{unassignedLessons.length} lessons</span>
            </div>
            <ol className={styles.lessonList}>
              {unassignedLessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                <li key={lesson.slug}>
                  <Link className={styles.lessonLink} to={`/${topic}/${lesson.slug}`}>
                    <span className={styles.lessonIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.lessonCopy}>
                      <strong>{lesson.title}</strong>
                      <span>Lesson · {lesson.summary}</span>
                    </span>
                    <span className={styles.arrow} aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  )
}
