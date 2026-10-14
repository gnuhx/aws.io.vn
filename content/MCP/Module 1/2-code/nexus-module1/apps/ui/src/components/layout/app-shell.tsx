import type { ReactNode } from 'react'
import { SkipLink } from '@/components/a11y/skip-link'
import type { Workspace } from '@/data/nav'
import type { PageId } from '@/lib/router'
import { MobileNav } from './mobile-nav'
import { SidebarContent } from './sidebar-content'
import { SiteHeader } from './site-header'

type Props = {
  workspaces: Workspace[]
  workspace: Workspace
  page: PageId
  userInitials: string
  children: ReactNode
}

/**
 * Landmark của một trang trong workspace:
 *   SkipLink → <aside>(<nav>) · <header> · <main id="main">
 * Trình đọc màn hình liệt kê các vùng này để nhảy thẳng tới.
 */
export function AppShell({ workspaces, workspace, page, userInitials, children }: Props) {
  const sidebarProps = { workspaces, workspaceId: workspace.id, page }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[16rem_1fr]">
      <SkipLink />
      <aside
        aria-label="Thanh bên"
        className="sticky top-0 hidden h-svh border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block"
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <SiteHeader
          workspaceName={workspace.name}
          userInitials={userInitials}
          mobileNav={<MobileNav {...sidebarProps} />}
        />
        <main id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
