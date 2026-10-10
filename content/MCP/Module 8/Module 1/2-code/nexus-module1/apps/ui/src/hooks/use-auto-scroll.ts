import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type Options = {
  /** Cách đáy bao nhiêu px thì vẫn tính là "đang ở cuối" */
  threshold?: number
}

/**
 * Chép nguyên từ Lab S1.2.
 * Tự cuộn khung chứa xuống cuối khi `content` đổi — trừ khi user đã cuộn lên đọc.
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  content: unknown,
  { threshold = 40 }: Options = {},
) {
  const ref = useRef<T>(null)
  const stickRef = useRef(true)
  const [isAtBottom, setIsAtBottom] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleScroll() {
      if (!el) return
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      const atBottom = distance <= threshold
      stickRef.current = atBottom
      setIsAtBottom(atBottom)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [threshold])

  useLayoutEffect(() => {
    const el = ref.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [content])

  const scrollToBottom = useCallback(() => {
    const el = ref.current
    if (!el) return
    stickRef.current = true
    setIsAtBottom(true)
    el.scrollTop = el.scrollHeight
  }, [])

  return { ref, isAtBottom, scrollToBottom }
}
