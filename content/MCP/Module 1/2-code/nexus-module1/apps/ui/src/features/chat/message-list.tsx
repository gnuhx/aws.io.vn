import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAutoScroll } from '@/hooks/use-auto-scroll'
import { cn } from '@/lib/utils'
import { ToolCallCard } from './tool-call-card'
import type { Message } from './types'

type Props = { messages: Message[]; busy: boolean }

export function MessageList({ messages, busy }: Props) {
  const { ref, isAtBottom, scrollToBottom } = useAutoScroll<HTMLDivElement>(messages)

  return (
    <div className="relative min-h-0 flex-1">
      {/*
        role="log": vùng tin nhắn nối tiếp nhau.
        aria-busy khi đang stream: nhờ trình đọc màn hình ĐỢI xong rồi mới đọc, thay vì đọc từng chữ.
        tabIndex={0}: vùng cuộn phải tới được bằng Tab để cuộn bằng phím mũi tên.
      */}
      <div
        ref={ref}
        role="log"
        aria-label="Cuộc trò chuyện"
        aria-busy={busy}
        tabIndex={0}
        className="h-full max-h-[60svh] min-h-64 overflow-y-auto rounded-lg border bg-background p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:max-h-[calc(100svh-17rem)]"
      >
        <ol className="space-y-5">
          {messages.map((m) => (
            <li key={m.id} className={cn('flex flex-col gap-1.5', m.role === 'user' && 'items-end')}>
              {/* Nhãn người nói là CHỮ thật — ai cũng thấy, trình đọc màn hình cũng đọc */}
              <p className="text-xs font-medium text-muted-foreground">{m.role === 'user' ? 'Bạn' : 'Nexus'}</p>
              {m.tool && <ToolCallCard tool={m.tool} />}
              {(m.text || m.role === 'user') && (
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {m.text}
                </p>
              )}
              {m.stopped && <p className="text-xs text-muted-foreground">Đã dừng theo yêu cầu của bạn.</p>}
            </li>
          ))}
        </ol>
      </div>

      {!isAtBottom && (
        <Button size="sm" variant="secondary" className="absolute right-4 bottom-4 shadow" onClick={scrollToBottom}>
          <ArrowDown aria-hidden="true" /> Tin mới nhất
        </Button>
      )}
    </div>
  )
}
