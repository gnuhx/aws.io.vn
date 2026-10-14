import { LayoutGrid, Plus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { navItems, type Workspace } from '@/data/nav'
import { href, type PageId } from '@/lib/router'
import { cn } from '@/lib/utils'

type Props = {
  workspaces: Workspace[]
  workspaceId: string
  page: PageId
  /** Gọi khi bấm bất kỳ link nào — MobileNav dùng để đóng Sheet */
  onNavigate?: () => void
}

// Link điều hướng: vòng focus rõ ràng, vùng bấm ≥ 32px, chữ đủ tương phản
const itemClass = cn(
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none',
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  'focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/60',
)

/** Nội dung sidebar — dùng chung cho sidebar desktop và Sheet trên mobile */
export function SidebarContent({ workspaces, workspaceId, page, onNavigate }: Props) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <p className="px-2 text-lg font-semibold tracking-tight">Nexus</p>

      <nav aria-label="Workspace">
        <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">Workspace</h2>
        <ul className="space-y-1">
          {workspaces.map((ws) => {
            const active = ws.id === workspaceId
            return (
              <li key={ws.id}>
                <a
                  href={href.page(ws.id, page)}
                  onClick={onNavigate}
                  aria-current={active ? 'true' : undefined}
                  className={cn(itemClass, active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground')}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-6 shrink-0 place-items-center rounded bg-sidebar-primary text-[10px] font-semibold text-sidebar-primary-foreground"
                  >
                    {ws.initials}
                  </span>
                  <span className="truncate">{ws.name}</span>
                </a>
              </li>
            )
          })}
          <li>
            <a href={href.newWorkspace} onClick={onNavigate} className={cn(itemClass, 'text-muted-foreground')}>
              <Plus className="size-4" aria-hidden="true" />
              Tạo workspace
            </a>
          </li>
          <li>
            <a href={href.workspaces} onClick={onNavigate} className={cn(itemClass, 'text-muted-foreground')}>
              <LayoutGrid className="size-4" aria-hidden="true" />
              Tất cả workspace
            </a>
          </li>
        </ul>
      </nav>

      <Separator />

      <nav aria-label="Chính">
        <ul className="space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = id === page
            return (
              <li key={id}>
                <a
                  href={href.page(workspaceId, id)}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    itemClass,
                    'text-muted-foreground',
                    active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <p className="mt-auto px-2 text-xs text-muted-foreground">Bản giao diện tĩnh · M1</p>
    </div>
  )
}
