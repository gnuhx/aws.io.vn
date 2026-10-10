import { useContext } from 'react'
import { ThemeContext } from './theme-context'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>')
  return ctx
}
