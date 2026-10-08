import { Link, useParams } from 'react-router'
import { findLesson, getLessonCatalog } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './LessonPage.module.css'

export function LessonPage() {
  const { topic = '', slug = '' } = useParams()
  const lesson = findLesson(topic, slug)

  if (!lesson) return <NotFoundPage />

  const topicLessons = getLessonCatalog()[topic] ?? []
  const moduleLessons = lesson.module
    ? topicLessons.filter((entry) => entry.module?.order === lesson.module?.order).sort((a, b) => a.order - b.order)
    : topicLessons.filter((entry) => !entry.module).sort((a, b) => a.order - b.order)
  const currentIndex = moduleLessons.findIndex((entry) => entry.slug === lesson.slug)
  const previous = moduleLessons[currentIndex - 1]
  const next = moduleLessons[currentIndex + 1]
  const pageTitle = topic === 'aws-saa-c03' ? 'AWS SAA-C03' : topic.replace(/-/g, ' ')
  const itemLabel = lesson.kind === 'section' ? 'Section' : 'Lesson'

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.brand}>aws.io.vn</Link>
        <span className={styles.topbarDivider}>/</span>
        <Link to={`/${topic}`} className={styles.topbarCourse}>{pageTitle}</Link>
      </header>

      <div className={`${styles.layout} ${lesson.interactiveHtmlUrl ? styles.layoutWide : ''}`}>
        <aside className={styles.sidebar} aria-label="Course navigation">
          <Link to={`/${topic}`} className={styles.backLink}>← Course overview</Link>
          <p className={styles.sidebarEyebrow}>{lesson.module ? `Module ${lesson.module.order}` : 'Lessons'}</p>
          <h2 className={styles.sidebarTitle}>{lesson.module?.title ?? pageTitle}</h2>
          <nav>
            <p className={styles.navLabel}>{lesson.kind === 'section' ? 'Sections' : 'Lessons'}</p>
            <ol className={styles.lessonNav}>
              {moduleLessons.map((entry, index) => (
                <li key={entry.slug}>
                  <Link
                    aria-current={entry.slug === lesson.slug ? 'page' : undefined}
                    className={`${styles.lessonNavLink} ${entry.slug === lesson.slug ? styles.lessonNavActive : ''}`}
                    to={`/${topic}/${entry.slug}`}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className={styles.main}>
          {lesson.interactiveHtmlUrl ? (
            <section className={styles.interactiveShell} aria-label={`${lesson.title} interactive lesson`}>
              <div className={styles.interactiveToolbar}>
                <span>Interactive lesson · original tabs, quizzes, labs, and navigation</span>
                <a href={lesson.interactiveHtmlUrl} target="_blank" rel="noreferrer">Open separately ↗</a>
              </div>
              <iframe
                className={styles.interactiveFrame}
                src={lesson.interactiveHtmlUrl}
                title={lesson.title}
                sandbox="allow-scripts"
              />
            </section>
          ) : (
            <>
              <div className={styles.articleMeta}>
                <span>{lesson.module ? `Module ${String(lesson.module.order).padStart(2, '0')}` : pageTitle}</span>
                <span className={styles.metaDot}>·</span>
                <span>{itemLabel} {String(currentIndex + 1).padStart(2, '0')}</span>
                <span className={styles.metaDot}>·</span>
                <span>Study notes</span>
              </div>
              <h1 className={styles.title}>{lesson.title}</h1>
              <p className={styles.summary}>{lesson.summary}</p>
              <div className={styles.rule} />
              <article className={styles.article} dangerouslySetInnerHTML={{ __html: lesson.bodyHtml }} />
            </>
          )}

          <nav className={styles.lessonPager} aria-label="Lesson navigation">
            {previous ? (
              <Link to={`/${topic}/${previous.slug}`} className={styles.pagerLink}>
                <span>← Previous {itemLabel.toLowerCase()}</span><strong>{previous.title}</strong>
              </Link>
            ) : <span />}
            {next && (
              <Link to={`/${topic}/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                <span>Next {itemLabel.toLowerCase()} →</span><strong>{next.title}</strong>
              </Link>
            )}
          </nav>
        </main>
      </div>
    </div>
  )
}
