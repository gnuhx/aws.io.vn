import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Mỗi trang đúng MỘT h1. tabIndex={-1}: nhận focus bằng code, không nằm trong vòng Tab. */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 id="page-title" tabIndex={-1} className={cn('text-2xl font-semibold tracking-tight outline-none', className)}>
      {children}
    </h1>
  )
}
