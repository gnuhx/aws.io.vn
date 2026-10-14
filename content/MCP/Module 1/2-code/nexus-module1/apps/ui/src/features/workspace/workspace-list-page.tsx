import { Plus } from 'lucide-react'
import { PageTitle } from '@/components/a11y/page-title'
import { SkipLink } from '@/components/a11y/skip-link'
import { PublicHeader } from '@/components/layout/public-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Workspace } from '@/data/nav'
import { href } from '@/lib/router'

type Props = { workspaces: Workspace[]; userInitials: string }

export function WorkspaceListPage({ workspaces, userInitials }: Props) {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <PublicHeader>
        <Avatar className="size-8">
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </PublicHeader>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 outline-none md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <PageTitle>Chọn workspace</PageTitle>
            <p className="text-sm text-muted-foreground">Mỗi workspace có dữ liệu và thành viên riêng.</p>
          </div>
          {/* Điều hướng sang trang khác → là LINK, dù trông như nút */}
          <Button asChild>
            <a href={href.newWorkspace}>
              <Plus aria-hidden="true" /> Tạo workspace
            </a>
          </Button>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2" aria-label="Danh sách workspace">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              {/* “Stretched link”: cả thẻ bấm được, nhưng trình đọc màn hình chỉ nghe MỘT link có tên rõ ràng */}
              <Card className="relative gap-3 py-5 transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-accent/50">
                <CardHeader className="flex flex-row items-center gap-3 px-5">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    {ws.initials}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">
                      <a
                        href={href.page(ws.id, 'chat')}
                        className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
                      >
                        {ws.name}
                      </a>
                    </CardTitle>
                    <CardDescription>nexus.app/{ws.id}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
