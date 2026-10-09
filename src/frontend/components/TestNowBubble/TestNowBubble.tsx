import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router'
import styles from './TestNowBubble.module.css'

type Point = { left: number; top: number }

const taunts = [
  'Bạn sợ à?',
  'Rén thì nói đi cưng',
  'Mày thích giọng ông cụ không?',
  'Bắt được tui rồi tính nha!',
  'Nhanh lên, mèo chê chậm đó!',
]

function startingPoint(): Point {
  return {
    left: Math.max(16, window.innerWidth - 190 - 16),
    top: Math.max(16, window.innerHeight - 56 - 16),
  }
}

function randomPoint(): Point {
  // Leave room for the longest taunt so the bubble stays on screen.
  const width = Math.min(300, window.innerWidth - 32)
  const height = 56
  const maxLeft = Math.max(16, window.innerWidth - width - 16)
  const maxTop = Math.max(16, window.innerHeight - height - 16)
  return {
    left: 16 + Math.random() * (maxLeft - 16),
    top: 16 + Math.random() * (maxTop - 16),
  }
}

export function TestNowBubble() {
  const [point, setPoint] = useState<Point | null>(() => typeof window === 'undefined' ? null : startingPoint())
  const [dart, setDart] = useState(false)
  const [title, setTitle] = useState('Do Test Now!')
  const [travelMs, setTravelMs] = useState(620)
  const timer = useRef<number | undefined>(undefined)
  const reducedMotion = useRef(false)
  const moveRef = useRef<(dodge?: boolean) => void>(() => {})
  const dodgeLimit = useRef(1)
  const dodgeCount = useRef(0)

  const move = useCallback((dodge = false) => {
    setPoint(randomPoint())
    setDart(dodge)
    // Cats alternate between a slow creep and a sudden dash.
    setTravelMs(dodge
      ? (Math.random() < 0.55 ? 180 + Math.random() * 180 : 850 + Math.random() * 450)
      : 450 + Math.random() * 1000)
    if (dodge) setTitle(taunts[Math.floor(Math.random() * taunts.length)])
    window.setTimeout(() => setDart(false), dodge ? 420 : 800)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => moveRef.current(), 1100 + Math.random() * 5200)
  }, [])
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    dodgeLimit.current = 1 + Math.floor(Math.random() * 7)
    if (reducedMotion.current) return

    moveRef.current = move
    timer.current = window.setTimeout(move, 1000)
    const onResize = () => setPoint(randomPoint())
    window.addEventListener('resize', onResize)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
      window.removeEventListener('resize', onResize)
    }
  }, [move])

  const dodge = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === 'mouse' && !reducedMotion.current && dodgeCount.current < dodgeLimit.current) {
      dodgeCount.current += 1
      move(true)
    }
  }

  return (
    <Link
      className={`${styles.bubble} ${dart ? styles.dart : ''}`}
      to="/aws-saa-c03/tests"
      aria-label="Do Test Now: choose a practice exam"
      style={point ? { left: point.left, top: point.top, '--travel-ms': `${travelMs}ms` } as CSSProperties : undefined}
      onPointerEnter={dodge}
    >
      <span className={styles.spark} aria-hidden="true">✦</span>
      <span>{title}</span>
    </Link>
  )
}
