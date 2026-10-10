import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
  theme: Theme // lựa chọn của user
  resolvedTheme: ResolvedTheme // thứ thật sự đang hiển thị
  setTheme: (theme: Theme) => void
}

export const STORAGE_KEY = 'nexus-theme' // phải khớp với script trong index.html

export const ThemeContext = createContext<ThemeContextValue | null>(null)
