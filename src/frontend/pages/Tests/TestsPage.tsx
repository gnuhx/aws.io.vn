import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getPracticeExams, type PracticeExam } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './TestsPage.module.css'

export function TestsPage() {
  const { topic = '' } = useParams()
  const exams = topic === 'aws-saa-c03' ? getPracticeExams() : []
  const [selected, setSelected] = useState<PracticeExam | null>(null)

  if (!exams.length) return <NotFoundPage />

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to={`/${topic}`} className={styles.backLink}>← Back to course</Link>
        <p className={styles.eyebrow}>AWS SAA-C03 · Practice</p>
        <h1>{selected ? selected.title : 'Choose a practice test'}</h1>
        <p className={styles.intro}>{selected ? 'Work through the exam, then review your answers and domain breakdown.' : 'Pick an exam to begin. Each test opens with its original timer, questions, and review experience.'}</p>
      </header>

      {selected ? (
        <section className={styles.examShell} aria-label={selected.title}>
          <div className={styles.toolbar}>
            <button className={styles.backButton} onClick={() => setSelected(null)}>← All tests</button>
            <a href={selected.url} target="_blank" rel="noreferrer">Open separately ↗</a>
          </div>
          <iframe className={styles.examFrame} src={selected.url} title={selected.title} sandbox="allow-scripts allow-forms allow-modals" />
        </section>
      ) : (
        <div className={styles.grid}>
          {exams.map((exam) => (
            <article className={styles.card} key={exam.id}>
              <div className={styles.cardTop}>
                <span className={styles.label}><span className={styles.labelDot} />Practice exam</span>
                <span className={styles.number}>#{String(exam.id).padStart(2, '0')}</span>
              </div>
              <h2>{exam.title}</h2>
              <p>{exam.description}</p>
              <div className={styles.cardFooter}>
                <div className={styles.stats} aria-label="Illustrative sample activity, not live data">
                  <span title="Sample total attempts">◉ {exam.attempts} tried</span>
                  <span title="Sample highest score yesterday">↗ Yesterday’s high <strong>{exam.yesterdayHigh}%</strong></span>
                </div>
                <button className={styles.startButton} onClick={() => setSelected(exam)}>Start <span aria-hidden="true">→</span></button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!selected && <p className={styles.sampleNote}>Activity numbers are sample data for now; live stats will come later.</p>}
    </main>
  )
}
