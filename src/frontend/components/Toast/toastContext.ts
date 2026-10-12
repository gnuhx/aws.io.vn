import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const noop = () => {}
// Toasts are extra feedback, never the only signal: components rendered without the provider (tests, isolated
// previews) get a silent API instead of a crash.
const silent: ToastApi = { success: noop, error: noop, info: noop }

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  return useContext(ToastContext) ?? silent
}
