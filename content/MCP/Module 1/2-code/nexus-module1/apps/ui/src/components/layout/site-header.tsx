import type { ReactNode } from 'react'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Props = { workspaceName: string; userInitials: string; mobileNav: ReactNode }

export function SiteHeader({ workspaceName, userInitials, mobileNav }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      {mobileNav}
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{workspaceName}</p>
      <Badge variant="secondary" className="hidden sm:inline-flex">
        Beta
      </Badge>
      <ModeToggle />
      <Avatar className="size-8">
        <AvatarFallback>{userInitials}</AvatarFallback>
      </Avatar>
    </header>
  )
}
