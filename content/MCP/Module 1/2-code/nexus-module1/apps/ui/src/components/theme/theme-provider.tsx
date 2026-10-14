import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STORAGE_KEY, ThemeContext, type Theme } from './theme-context'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system' // localStorage có thể bị chặn (chế độ riêng tư…)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy init: chỉ đọc localStorage một lần lúc mount
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches)

  // (1) Nghe hệ điều hành đổi sáng/tối = hệ thống ngoài → effect + cleanup
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Derived: tính khi render, không phải state
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  // (2) Đồng bộ class trên <html> = DOM ngoài cây React → effect
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  // (3) Lưu lựa chọn: xảy ra VÌ user chọn → làm trong hàm set, không phải effect
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* không lưu được thì thôi, UI vẫn đổi */
    }
  }, [])

  // Giữ object value ổn định → component đọc context không render thừa
  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
