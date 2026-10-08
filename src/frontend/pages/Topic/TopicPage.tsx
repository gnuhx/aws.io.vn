import { Link, useParams } from 'react-router'
import { getLessonCatalog } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './TopicPage.module.css'

export function TopicPage() {
  const { topic = '' } = useParams()
  const lessons = getLessonCatalog()[topic] ?? []

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
  const label = topic === 'aws-saa-c03' ? 'AWS Certified Solutions Architect — Associate' : topic.replace(/-/g, ' ')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} to="/">← All topics</Link>
        <p className={styles.eyebrow}>Learning path</p>
        <h1>{label}</h1>
        <p className={styles.intro}>A clear path through the concepts, one focused lesson at a time.</p>
        <div className={styles.courseMeta}>
          <span>{lessons.length} content pages</span>
          {sortedModules.length > 0 && <span>{sortedModules.length} {sortedModules.length === 1 ? 'module' : 'modules'}</span>}
        </div>
        {topic === 'aws-saa-c03' && (
          <Link className={styles.roadmapLink} to="/aws-saa-c03/roadmap">View full course roadmap ↗</Link>
        )}
      </header>

      <div className={styles.curriculum}>
        {sortedModules.map(([order, group]) => (
          <section className={styles.module} key={order}>
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>{String(order).padStart(2, '0')}</span>
              <div>
                <p className={styles.moduleKicker}>Module {order}</p>
                <h2>{group.title}</h2>
              </div>
              <span className={styles.lessonCount}>{group.lessons.length} materials</span>
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
