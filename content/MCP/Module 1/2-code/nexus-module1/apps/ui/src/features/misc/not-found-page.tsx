import { PageTitle } from '@/components/a11y/page-title'
import { SkipLink } from '@/components/a11y/skip-link'
import { PublicHeader } from '@/components/layout/public-header'
import { Button } from '@/components/ui/button'
import { href } from '@/lib/router'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <PublicHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 outline-none md:p-8">
        <PageTitle>Không tìm thấy trang</PageTitle>
        <p className="text-muted-foreground">Đường dẫn này không tồn tại hoặc workspace đã bị xoá.</p>
        <Button asChild>
          <a href={href.workspaces}>Về danh sách workspace</a>
        </Button>
      </main>
    </div>
  )
}
