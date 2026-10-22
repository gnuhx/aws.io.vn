import { Fragment, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { findLessonProgressEntry } from '../../../shared/lessonProgress.ts'
import { isRoadmapId } from '../../../shared/roadmapProgress.ts'
import { findLesson, getLessonCatalog, getLessonContentPath, getTopicLabel, groupLessonsBySection, resolveLessonAssetUrl, type LessonEntry } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import { useResumeReading } from '../../reading/useResumeReading.ts'
import { LessonReadControl } from './LessonReadControl.tsx'
import styles from './LessonPage.module.css'

const MarkdownView = lazy(() => import('../../components/Markdown/MarkdownView.tsx').then((module) => ({ default: module.MarkdownView })))

/** Mounted inside the Suspense boundary: its effect runs only once the lazy Markdown renderer has rendered. */
function Rendered({ onRendered }: { onRendered: () => void }) {
  useEffect(onRendered, [onRendered])
  return null
}

function LessonContent({ topic, lesson }: { topic: string; lesson: LessonEntry }) {
  const [markdown, setMarkdown] = useState(lesson.bodyMarkdown)
  const [markdownError, setMarkdownError] = useState(false)
  const [loadingMarkdown, setLoadingMarkdown] = useState(Boolean(lesson.markdownUrl))
  const [rendered, setRendered] = useState(false)
  const markRendered = useCallback(() => setRendered(true), [])
  const resolveUrl = useCallback((url: string) => resolveLessonAssetUrl(lesson, url), [lesson])
  const articleRef = useRef<HTMLElement>(null)
  useResumeReading({ topic, lessonSlug: lesson.slug, containerRef: articleRef, contentReady: rendered && !loadingMarkdown && !markdownError })

  useEffect(() => {
    if (!lesson.markdownUrl) return

    let active = true
    fetch(lesson.markdownUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load lesson content')
        return response.text()
      })
      .then((raw) => {
        if (!active) return
        const body = raw
          .replace(/^---[\s\S]*?---\n?/, '')
          .replace(/^#\s+[^\n]+\n+/, '')
          .trim()
        setMarkdown(body)
      })
      .catch(() => {
        if (active) setMarkdownError(true)
      })
      .finally(() => {
        if (active) setLoadingMarkdown(false)
      })

    return () => { active = false }
  }, [lesson.markdownUrl])

  if (markdownError) {
    return <article className={styles.article}><p>We couldn’t load this lesson right now. Please refresh and try again.</p></article>
  }

  return (
    <article ref={articleRef} className={styles.article} aria-busy={loadingMarkdown}>
      {loadingMarkdown && <p className={styles.loadingLesson}><Spinner /> Loading lesson…</p>}
      <Suspense fallback={<p className={styles.loadingLesson}><Spinner /> Loading lesson renderer…</p>}>
        <MarkdownView markdown={markdown} resolveUrl={resolveUrl} />
        <Rendered onRendered={markRendered} />
      </Suspense>
    </article>
  )
}

const COMPACT_LAYOUT = '(max-width: 1024px)'

export function LessonPage() {
  const { topic = '', slug = '' } = useParams()
  const lesson = findLesson(topic, slug)
  // Same width as the single-column breakpoint in LessonPage.module.css.
  const compact = useMediaQuery(COMPACT_LAYOUT)

  if (!lesson) return <NotFoundPage />

  const topicLessons = getLessonCatalog()[topic] ?? []
  const moduleLessons = lesson.module
    ? topicLessons.filter((entry) => entry.module?.order === lesson.module?.order).sort((a, b) => a.order - b.order)
    : topicLessons.filter((entry) => !entry.module).sort((a, b) => a.order - b.order)
  const currentIndex = moduleLessons.findIndex((entry) => entry.slug === lesson.slug)
  const previous = moduleLessons[currentIndex - 1]
  const next = moduleLessons[currentIndex + 1]
  const pageTitle = topic === 'aws-saa-c03' ? 'AWS SAA-C03' : getTopicLabel(topic)
  const itemLabel = lesson.kind === 'section'
    ? 'Section'
    : lesson.kind === 'overview'
      ? 'Overview'
      : lesson.kind === 'visual'
        ? 'Interactive visual'
        : 'Lesson'
  const navLabel = lesson.kind === 'section' ? 'Sections' : 'Lessons'
  const lessonNav = (
    <nav>
      <p className={styles.navLabel}>{navLabel}</p>
      {groupLessonsBySection(moduleLessons).map((group) => (
        <Fragment key={group.section?.order ?? 'lessons'}>
          {group.section && <p className={styles.navSection}>{group.section.title}</p>}
          <ol className={styles.lessonNav}>
            {group.lessons.map((entry) => (
              <li key={entry.slug}>
                <Link
                  aria-current={entry.slug === lesson.slug ? 'page' : undefined}
                  className={`${styles.lessonNavLink} ${entry.slug === lesson.slug ? styles.lessonNavActive : ''}`}
                  to={`/${topic}/${entry.slug}`}
                >
                  <span>{String(moduleLessons.indexOf(entry) + 1).padStart(2, '0')}</span>
                  {entry.title}
                </Link>
              </li>
            ))}
          </ol>
        </Fragment>
      ))}
    </nav>
  )
  // Only lessons that belong to a roadmap can be marked read; progress is scoped to that roadmap.
  const progressEntry = isRoadmapId(topic) ? findLessonProgressEntry(topic, getLessonContentPath(lesson)) : undefined

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
          {compact ? (
            // One column: the article must come first, so the module's lesson list starts collapsed.
            // Keyed by lesson so picking a lesson from the list closes it again on the next page.
            <details key={lesson.slug} className={styles.navDetails}>
              <summary>{navLabel} in this module ({moduleLessons.length})</summary>
              {lessonNav}
            </details>
          ) : lessonNav}
        </aside>

        <main className={styles.main}>
          {lesson.interactiveHtmlUrl ? (
            <section className={styles.interactiveShell} aria-label={`${lesson.title} interactive lesson`}>
              <div className={styles.interactiveToolbar}>
                <span>Interactive lesson · labs and sample code</span>
                <a href={lesson.interactiveHtmlUrl} target="_blank" rel="noreferrer">Open lesson and code samples separately ↗</a>
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
                <span>{lesson.section?.title ?? 'Study notes'}</span>
              </div>
              <h1 className={styles.title}>{lesson.title}</h1>
              <p className={styles.summary}>{lesson.summary}</p>
              <div className={styles.rule} />
              <LessonContent key={lesson.slug} topic={topic} lesson={lesson} />
            </>
          )}

          {progressEntry && isRoadmapId(topic) && (
            <LessonReadControl key={progressEntry.id} roadmapId={topic} lessonId={progressEntry.id} />
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
