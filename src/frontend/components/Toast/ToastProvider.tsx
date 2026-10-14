import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastTone } from './toastContext.ts'
import styles from './Toast.module.css'

type Toast = { id: number; tone: ToastTone; message: string }

// Errors stay up longer: they usually ask the learner to do something.
const DURATION_MS: Record<ToastTone, number> = { success: 3500, info: 3500, error: 7000 }
const MAX_VISIBLE = 4
const ICONS: Record<ToastTone, string> = { success: '✓', error: '!', info: 'i' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE))
    timers.current.set(id, setTimeout(() => dismiss(id), DURATION_MS[tone]))
  }, [dismiss])

  useEffect(() => {
    const pending = timers.current
    return () => { for (const timer of pending.values()) clearTimeout(timer) }
  }, [])

  const api = useMemo<ToastApi>(() => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    info: (message) => show('info', message),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Always mounted so screen readers pick up toasts added later. */}
      <div className={styles.region} role="status" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
            <span className={styles.icon} aria-hidden="true">{ICONS[toast.tone]}</span>
            <p className={styles.message}>{toast.message}</p>
            <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
