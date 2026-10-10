import { PageTitle } from '@/components/a11y/page-title'
import { SkipLink } from '@/components/a11y/skip-link'
import { PublicHeader } from '@/components/layout/public-header'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { href, navigate } from '@/lib/router'
import { CreateWorkspaceForm } from './create-workspace-form'

type Props = { onCreated: (ws: { id: string; name: string }) => void }

export function NewWorkspacePage({ onCreated }: Props) {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <PublicHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 outline-none md:p-8">
        <p className="text-sm">
          <a href={href.workspaces} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
            ← Tất cả workspace
          </a>
        </p>
        <Card>
          <CardHeader>
            <PageTitle className="text-xl">Tạo workspace</PageTitle>
            <CardDescription>Mỗi workspace có dữ liệu và thành viên riêng.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWorkspaceForm onCreated={onCreated} onCancel={() => navigate(href.workspaces)} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
