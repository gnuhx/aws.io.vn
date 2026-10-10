import { Send, Square } from 'lucide-react'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Props = { running: boolean; onSend: (text: string) => void; onStop: () => void }

export function Composer({ running, onSend, onStop }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const canSend = !running && text.trim().length > 0

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: đang gõ dấu tiếng Việt bằng bộ gõ (IME) → Enter là để chốt chữ, KHÔNG phải để gửi
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  function handleStop() {
    onStop()
    inputRef.current?.focus() // đưa người dùng bàn phím về đúng chỗ để hỏi tiếp
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && running) handleStop()
      }}
      className="space-y-2"
    >
      <label htmlFor="chat-input" className="sr-only">
        Câu hỏi cho Nexus
      </label>
      <div className="flex items-end gap-2">
        <Textarea
          id="chat-input"
          ref={inputRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về khách hàng, doanh thu…"
          aria-describedby="chat-hint"
          className="min-h-11 resize-none"
        />
        {/*
          MỘT nút duy nhất đổi vai (Gửi ↔ Dừng) thay vì 2 nút thay phiên:
          phần tử không bị gỡ khỏi DOM → focus không rơi mất.
          aria-disabled thay cho disabled: nút vẫn nằm trong vòng Tab, trình đọc màn hình đọc "không khả dụng".
        */}
        <Button
          type={running ? 'button' : 'submit'}
          onClick={running ? handleStop : undefined}
          variant={running ? 'outline' : 'default'}
          aria-disabled={!running && !canSend}
          aria-keyshortcuts={running ? 'Escape' : undefined}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {running ? <Square aria-hidden="true" /> : <Send aria-hidden="true" />}
          {running ? 'Dừng' : 'Gửi'}
        </Button>
      </div>
      <p id="chat-hint" className="text-xs text-muted-foreground">
        Enter để gửi · Shift+Enter xuống dòng · Esc để dừng khi Nexus đang chạy
      </p>
    </form>
  )
}
