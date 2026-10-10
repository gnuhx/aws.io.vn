import { CircleCheck, CircleSlash } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import type { ToolCall } from './types'

const TEXT = {
  running: (t: ToolCall) => `Đang chạy: ${t.label}…`,
  done: (t: ToolCall) => `Đã xong: ${t.label} · ${t.output}`,
  stopped: (t: ToolCall) => `Đã dừng: ${t.label}`,
}

/** Trạng thái nói bằng CHỮ, icon chỉ minh hoạ (aria-hidden) → không phụ thuộc màu hay hình */
export function ToolCallCard({ tool }: { tool: ToolCall }) {
  const Icon = tool.status === 'done' ? CircleCheck : CircleSlash
  return (
    <div className="rounded-lg border bg-muted/50 text-sm" aria-busy={tool.status === 'running'}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {tool.status === 'running' ? (
          <Spinner aria-hidden="true" role={undefined} aria-label={undefined} className="motion-reduce:animate-none" />
        ) : (
          <Icon className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span className="font-medium">{TEXT[tool.status](tool)}</span>
        <code className="ml-auto rounded bg-background px-1.5 py-0.5 text-xs">{tool.name}</code>
      </div>
      {/* <details> có sẵn hành vi bàn phím (Enter/Space) và trạng thái mở/đóng cho trình đọc màn hình */}
      <details className="border-t px-3 py-2">
        <summary className="cursor-pointer rounded text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          Xem input của tool
        </summary>
        <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs">{JSON.stringify(tool.input, null, 2)}</pre>
      </details>
    </div>
  )
}
