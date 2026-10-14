import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { ReadingPosition } from '../../shared/schemas/reading.ts'
import { useAuth } from '../auth/authContext.ts'
import type { LessonEntry } from '../content.ts'
import { readingApi } from './api.ts'
import styles from './ContinueReading.module.css'

/** "Continue reading" for a course. Renders nothing, and requests nothing, unless the user turned resume on. */
export function ContinueReading({ topic, lessons }: { topic: string; lessons: LessonEntry[] }) {
  const { status, user } = useAuth()
  const owner = status === 'signed-in' && user?.preferences.resumeReading ? user.id : null
  const [saved, setSaved] = useState<{ owner: string; topic: string; position: ReadingPosition | null } | null>(null)

  useEffect(() => {
    if (!owner) return
    let active = true
    readingApi.get(topic)
      .then((position) => { if (active) setSaved({ owner, topic, position }) })
      .catch(() => {}) // Optional shortcut: the course page works the same without it.
    return () => { active = false }
  }, [owner, topic])

  const position = owner && saved?.owner === owner && saved.topic === topic ? saved.position : null
  const lesson = position && lessons.find((entry) => entry.slug === position.lessonSlug)
  if (!lesson) return null

  return (
    // No #hash: the lesson page restores the saved section itself.
    <Link className={styles.continue} to={`/${topic}/${lesson.slug}`}>
      <span className={styles.label}>Continue reading</span>
      <strong>{lesson.title}</strong>
      <span aria-hidden="true" className={styles.arrow}>→</span>
    </Link>
  )
}
