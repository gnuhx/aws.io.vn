import { PageTitle } from '@/components/a11y/page-title'
import { Button } from '@/components/ui/button'
import { href } from '@/lib/router'

type Props = { title: string; when: string; workspaceId: string }

/** Trang chưa làm: nói rõ khi nào có, và cho một lối đi tiếp */
export function PlaceholderPage({ title, when, workspaceId }: Props) {
  return (
    <div className="space-y-4">
      <PageTitle>{title}</PageTitle>
      <p className="max-w-prose text-muted-foreground">Trang này sẽ được dựng ở {when}. Hiện bạn có thể hỏi Nexus trong Chat.</p>
      <Button asChild variant="outline">
        <a href={href.page(workspaceId, 'chat')}>Mở Chat</a>
      </Button>
    </div>
  )
}
