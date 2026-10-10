import type { ReactNode } from 'react'
import { ModeToggle } from '@/components/theme/mode-toggle'

/** Header của các trang chưa vào workspace (đăng nhập, đăng ký, chọn workspace) */
export function PublicHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4 md:px-6">
      <p className="flex-1 text-lg font-semibold tracking-tight">Nexus</p>
      {children}
      <ModeToggle />
    </header>
  )
}
