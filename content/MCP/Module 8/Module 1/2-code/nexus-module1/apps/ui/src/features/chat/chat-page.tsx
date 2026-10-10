import { PageTitle } from '@/components/a11y/page-title'
import type { Workspace } from '@/data/nav'
import { Composer } from './composer'
import { MessageList } from './message-list'
import { useFakeAgent } from './use-fake-agent'

export function ChatPage({ workspace }: { workspace: Workspace }) {
  const { messages, status, send, stop } = useFakeAgent()
  const running = status !== 'idle'

  // Derived: câu thông báo cho trình đọc màn hình, tính từ state có sẵn
  const last = messages[messages.length - 1]
  const announcement =
    status === 'tool'
      ? `Đang chạy tool: ${last.tool?.label}`
      : status === 'streaming'
        ? 'Nexus đang trả lời'
        : last.role === 'assistant' && last.stopped
          ? 'Đã dừng'
          : last.role === 'assistant'
            ? 'Nexus đã trả lời xong'
            : ''

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1">
        <PageTitle>Chat</PageTitle>
        <p className="text-sm text-muted-foreground">Hỏi Nexus về dữ liệu của {workspace.name}.</p>
      </div>

      <MessageList messages={messages} busy={status === 'streaming'} />

      {/* Vùng trạng thái: trình đọc màn hình đọc khi chữ đổi, không cướp focus */}
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <Composer running={running} onSend={send} onStop={stop} />
    </div>
  )
}
