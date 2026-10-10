import { useSyncExternalStore } from 'react'

/**
 * Router “tạm” bằng hash (#/…) cho giao diện tĩnh — M9 thay bằng App Router của Next.js.
 * Mỗi màn hình có URL riêng → Back/Forward chạy, và Lighthouse đo được từng trang.
 */
export type PageId = 'chat' | 'dashboard' | 'customers' | 'docs' | 'settings'
export const PAGE_IDS: PageId[] = ['chat', 'dashboard', 'customers', 'docs', 'settings']

export type Route =
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'workspaces' }
  | { name: 'new-workspace' }
  | { name: 'app'; ws: string; page: PageId }
  | { name: 'not-found' }

export const href = {
  login: '#/login',
  register: '#/register',
  workspaces: '#/workspaces',
  newWorkspace: '#/workspaces/new',
  page: (ws: string, page: PageId) => `#/w/${ws}/${page}`,
}

export function parseRoute(hash: string): Route {
  const parts = (hash.replace(/^#/, '') || '/login').split('/').filter(Boolean)
  const [a, b, c] = parts
  if (parts.length === 1 && a === 'login') return { name: 'login' }
  if (parts.length === 1 && a === 'register') return { name: 'register' }
  if (parts.length === 1 && a === 'workspaces') return { name: 'workspaces' }
  if (parts.length === 2 && a === 'workspaces' && b === 'new') return { name: 'new-workspace' }
  if (parts.length === 3 && a === 'w' && PAGE_IDS.includes(c as PageId)) {
    return { name: 'app', ws: b, page: c as PageId }
  }
  return { name: 'not-found' }
}

export function navigate(to: string) {
  window.location.hash = to
}

// URL là “hệ thống ngoài” → đọc bằng useSyncExternalStore (đăng ký + huỷ đăng ký sự kiện)
function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}
const getHash = () => window.location.hash

export function useHash() {
  return useSyncExternalStore(subscribe, getHash)
}
