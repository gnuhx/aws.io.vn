import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router'
import styles from './TestNowBubble.module.css'

type Point = { left: number; top: number }

function randomPoint(): Point {
  const width = 160
  const height = 52
  const maxLeft = Math.max(16, window.innerWidth - width - 16)
  const maxTop = Math.max(16, window.innerHeight - height - 16)
  return {
    left: 16 + Math.random() * (maxLeft - 16),
    top: 16 + Math.random() * (maxTop - 16),
  }
}

export function TestNowBubble() {
  const [point, setPoint] = useState<Point | null>(() => typeof window === 'undefined' ? null : randomPoint())
  const [dart, setDart] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const reducedMotion = useRef(false)
  const moveRef = useRef<(dodge?: boolean) => void>(() => {})
  const dodgeLimit = useRef(1)
  const dodgeCount = useRef(0)

  const move = useCallback((dodge = false) => {
    setPoint(randomPoint())
    setDart(dodge)
    window.setTimeout(() => setDart(false), dodge ? 420 : 800)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => moveRef.current(), 1100 + Math.random() * 5200)
  }, [])
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    dodgeLimit.current = 1 + Math.floor(Math.random() * 7)
    if (reducedMotion.current) return

    moveRef.current = move
    timer.current = window.setTimeout(move, 1500 + Math.random() * 2500)
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
      style={point ? { left: point.left, top: point.top } : undefined}
      onPointerEnter={dodge}
    >
      <span className={styles.spark} aria-hidden="true">✦</span>
      <span>Do Test Now!</span>
    </Link>
  )
}
