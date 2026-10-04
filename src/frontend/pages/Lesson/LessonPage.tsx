import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { findLesson } from '../../content.ts'
import { NotFoundPage } from '../NotFound/NotFoundPage.tsx'
import styles from './LessonPage.module.css'

type TabKey = 'theory' | 'lab' | 'cheat'

type TocItem = {
  id: string
  label: string
  level: number
}

type DiagramScenario = {
  id: string
  label: string
  explanation: string
  active: number[]
}

const tabLabels: Record<TabKey, string> = {
  theory: 'Lý thuyết',
  lab: 'Lab',
  cheat: 'Cheat Sheet',
}

const scenarioMap: Record<string, DiagramScenario[]> = {
  flow: [
    {
      id: 'npm-test',
      label: 'npm test',
      explanation: 'The build gate runs first and blocks unsafe changes before deployment.',
      active: [0, 1, 2],
    },
    {
      id: 'rm-dist',
      label: 'rm -rf dist',
      explanation: 'This action is dangerous because it removes the generated build output and is stopped in a controlled pipeline.',
      active: [0, 3],
    },
    {
      id: 'read-env',
      label: 'read .env',
      explanation: 'Sensitive values are treated as protected data and never exposed in the chat output.',
      active: [0, 4],
    },
  ],
}

function DiagramCard({ title, caption, scenarioKey }: { title: string; caption: string; scenarioKey: string }) {
  const scenarios = scenarioMap[scenarioKey]
  const [active, setActive] = useState(scenarios[0].id)

  const selected = scenarios.find((scenario) => scenario.id === active) ?? scenarios[0]

  return (
    <section className={styles.diagramSection}>
      <h3 className={styles.diagramTitle}>{title}</h3>
      <p className={styles.diagramCaption}>{caption}</p>

      <div className={styles.diagramStage}>
        <svg viewBox="0 0 640 240" role="img" aria-label={title}>
          <rect x="22" y="28" width="170" height="68" rx="18" fill={active === 'npm-test' ? '#d8b687' : '#efe4d4'} stroke="#7c4f38" strokeWidth="1.5" />
          <rect x="250" y="18" width="170" height="88" rx="18" fill={active === 'read-env' ? '#d8b687' : '#efe4d4'} stroke="#7c4f38" strokeWidth="1.5" />
          <rect x="470" y="30" width="150" height="66" rx="18" fill={active === 'rm-dist' ? '#d8b687' : '#efe4d4'} stroke="#7c4f38" strokeWidth="1.5" />
          <rect x="175" y="135" width="300" height="72" rx="18" fill={active === 'npm-test' ? '#d9e2c5' : '#efede9'} stroke="#7c4f38" strokeWidth="1.5" />

          <line x1="192" y1="62" x2="250" y2="62" stroke={selected.active.includes(0) ? '#8c4d35' : '#c7b59e'} strokeWidth={selected.active.includes(0) ? 4 : 2} strokeDasharray={selected.active.includes(0) ? '0' : '8 8'} />
          <line x1="420" y1="62" x2="470" y2="62" stroke={selected.active.includes(1) ? '#8c4d35' : '#c7b59e'} strokeWidth={selected.active.includes(1) ? 4 : 2} strokeDasharray={selected.active.includes(1) ? '0' : '8 8'} />
          <line x1="335" y1="106" x2="335" y2="135" stroke={selected.active.includes(2) ? '#7d8b52' : '#c7b59e'} strokeWidth={selected.active.includes(2) ? 4 : 2} />
          <line x1="260" y1="135" x2="180" y2="170" stroke={selected.active.includes(3) ? '#c08253' : '#c7b59e'} strokeWidth={selected.active.includes(3) ? 4 : 2} />
          <line x1="380" y1="135" x2="510" y2="170" stroke={selected.active.includes(4) ? '#7d8b52' : '#c7b59e'} strokeWidth={selected.active.includes(4) ? 4 : 2} />

          <text x="96" y="68" textAnchor="middle" fontSize="13" fill="#392924">Local</text>
          <text x="335" y="66" textAnchor="middle" fontSize="13" fill="#392924">AI / Tools</text>
          <text x="545" y="67" textAnchor="middle" fontSize="13" fill="#392924">Remote</text>
          <text x="335" y="177" textAnchor="middle" fontSize="13" fill="#392924">Guardrail</text>
        </svg>
      </div>

      <div className={styles.diagramActions}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`${styles.scenarioButton} ${active === scenario.id ? styles.scenarioButtonActive : ''}`}
            onClick={() => setActive(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      <div className={styles.diagramResult}>{selected.explanation}</div>
    </section>
  )
}

export function LessonPage() {
  const { topic = '', slug = '' } = useParams()
  const lesson = findLesson(topic, slug)
  const articleRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('theory')
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const [progress, setProgress] = useState(18)

  useEffect(() => {
    const article = articleRef.current
    if (!article) return

    const headings = Array.from(article.querySelectorAll('h2, h3'))
    const items = headings.map((heading, index) => {
      const text = heading.textContent ?? `Section ${index + 1}`
      const id = heading.id || `section-${index + 1}`
      heading.id = id
      return { id, label: text, level: Number(heading.tagName.replace('H', '')) }
    })

    setToc(items)

    const updateScrollState = () => {
      const scrollable = article.scrollHeight - window.innerHeight
      const nextProgress = Math.min(100, Math.max(12, (window.scrollY / Math.max(scrollable, 1)) * 100))
      setProgress(Number(nextProgress.toFixed(0)))

      let currentId = items[0]?.id ?? ''
      for (const item of items) {
        const element = document.getElementById(item.id)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        if (rect.top <= 180) {
          currentId = item.id
        }
      }
      setActiveHeadingId(currentId)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [lesson])

  if (!lesson) {
    return <NotFoundPage />
  }

  return (
    <div className={styles.pageShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sessionLabel}>Session • {topic.replace(/-/g, ' ')}</div>
        <h1 className={styles.sessionTitle}>{lesson.title}</h1>
        <div className={styles.sessionMeta}>Course / Module 7 • {lesson.title}</div>

        <div className={styles.progressWrap}>
          <div className={styles.progressHeader}>
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className={styles.progressTrack} aria-label="Scroll progress">
            <span className={styles.progressFill} style={{ ['--progress' as string]: `${progress}%` }} />
          </div>
          <div className={styles.locationLabel}>Bạn đang ở: {toc.find((item) => item.id === activeHeadingId)?.label ?? 'Overview'}</div>
        </div>

        <div className={styles.tabList}>
          {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className={styles.toc}>
          <p className={styles.tocTitle}>Table of contents</p>
          <ul className={styles.tocList}>
            {toc.map((item) => {
              const isActive = item.id === activeHeadingId
              const seen = item.id !== activeHeadingId && progress > 20

              return (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ''}`}>
                    <span className={`${styles.tocState} ${seen ? styles.tocStateSeen : ''}`}>{seen ? '✓' : ''}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <div className={styles.sessionFoot}>
          <strong>Learning path:</strong> already learned • now reading • next: practice and recap
        </div>
      </aside>

      <main className={styles.main}>
        <article className={styles.articleCard}>
          <header className={styles.articleHeader}>
            <div className={styles.kicker}>{topic.replace(/-/g, ' ')} • Lesson {lesson.order}</div>
            <h2 className={styles.articleTitle}>{lesson.title}</h2>
            <p className={styles.articleSubtitle}>Hình trước, chữ sau: bắt đầu từ bức tranh lớn, rồi mới đi vào chi tiết kỹ thuật.</p>
          </header>

          {activeTab === 'theory' && (
            <div ref={articleRef} className={styles.articleBody} dangerouslySetInnerHTML={{ __html: lesson.bodyHtml }} />
          )}

          {activeTab === 'lab' && (
            <div className={styles.articleBody}>
              <h2>Lab — xem luồng thật</h2>
              <p>Thực hiện theo từng bước dưới đây và quan sát nơi dữ liệu đi qua, nơi nào được chặn, và nơi nào cần xác nhận.</p>
              <ol>
                <li>Khởi động môi trường bằng lệnh kiểm tra nhanh.</li>
                <li>Đọc kỹ file cấu hình và xác định điểm vào của dữ liệu nhạy cảm.</li>
                <li>Chạy bước xác thực cuối cùng và kiểm tra cảnh báo.</li>
              </ol>
              <div className={styles.codeHeader}>
                <div className={styles.windowDots}><span /><span /><span /></div>
                <span className={styles.codeTitle}>terminal.sh</span>
              </div>
              <pre><code>$ npm test
$ npm run lint
$ npm run typecheck</code></pre>
            </div>
          )}

          {activeTab === 'cheat' && (
            <div className={styles.articleBody}>
              <h2>Cheat Sheet</h2>
              <p>Đọc từ trái sang phải: đầu vào → xử lý → kiểm tra → kết quả.</p>
              <ul>
                <li>Nhớ mô hình tổng quát, không biệt lập từng lệnh.</li>
                <li>Luôn xác định dữ liệu nào là nhạy cảm và phải dừng lại ở đâu.</li>
                <li>Quyết định hệ thống dựa trên các nhánh match / pass / block.</li>
              </ul>
              <DiagramCard title="Bản đồ tổng module" caption="Mô hình theo dõi từ đầu vào tới kết quả cuối cùng." scenarioKey="flow" />
            </div>
          )}

          {activeTab === 'theory' && (
            <>
              <DiagramCard title="Service map" caption="Mỗi thành phần có vai trò rõ ràng và dữ liệu đi qua các điểm kiểm soát." scenarioKey="flow" />
              <DiagramCard title="Decision flow" caption="Khi hành động nguy hiểm xảy ra, hệ thống rẽ sang nhánh chặn hoặc xác nhận." scenarioKey="flow" />

              <section className={styles.summaryCard}>
                <h3>Nhìn lại bức tranh lớn</h3>
                <p>Tóm lại, mô hình này giúp chúng ta thấy rõ nơi dữ liệu bắt đầu, nơi nó đi qua, nơi nào cần kiểm tra, và khi nào phải dừng lại để tránh lỗi hoặc rủi ro.</p>
              </section>

              <section className={styles.selfQuiz}>
                <h3>Tự vẽ lại</h3>
                <ul>
                  <li>Hệ thống bắt đầu ở đâu và kết thúc ở đâu?</li>
                  <li>Điểm nào cần chặn hoặc xác nhận trước khi tiếp tục?</li>
                  <li>Nếu dữ liệu nhạy cảm đi ra ngoài máy, hệ thống cần làm gì?</li>
                </ul>
              </section>
            </>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <Link to={`/${topic}`}>← Quay lại danh sách</Link>
          </div>
        </article>
      </main>
    </div>
  )
}
