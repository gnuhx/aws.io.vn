import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentStatus, Message, ToolCall } from './types'

/**
 * Agent GIẢ cho giao diện tĩnh: chạy "tool" 1,5 giây rồi stream câu trả lời từng chữ.
 * M2 thay bằng LLM + MCP thật; M11 thêm stream tool call thật. Hình dạng dữ liệu giữ nguyên.
 */
const SCRIPTS: { match: RegExp; tool: Omit<ToolCall, 'status'>; answer: string }[] = [
  {
    match: /doanh thu|revenue/i,
    tool: { name: 'nexus_revenue_by', label: 'Tính doanh thu theo tháng', input: { groupBy: 'month', months: 6 }, output: '6 tháng, tổng 2.902 triệu' },
    answer:
      'Doanh thu 6 tháng gần nhất tăng đều: từ 412 triệu (tháng 4) lên 569 triệu (tháng 9), tức tăng khoảng 38%. Tháng 6 giảm nhẹ so với tháng 5 rồi tăng trở lại.',
  },
  {
    match: /.*/,
    tool: { name: 'nexus_list_customers', label: 'Tra danh sách khách hàng', input: { city: 'Hà Nội', limit: 50 }, output: '42 khách hàng' },
    answer:
      'Hiện có 42 khách hàng ở Hà Nội. Hai khách lớn nhất là Cà phê Phố Cổ (48 đơn) và Mộc Coffee (37 đơn). Bạn muốn xem theo quận hay theo doanh thu?',
  },
]

export const SEED: Message[] = [
  { id: 'm1', role: 'user', text: 'Có bao nhiêu khách hàng ở Đà Nẵng?' },
  {
    id: 'm2',
    role: 'assistant',
    tool: { name: 'nexus_list_customers', label: 'Tra danh sách khách hàng', status: 'done', input: { city: 'Đà Nẵng', limit: 50 }, output: '17 khách hàng' },
    text: 'Có 17 khách hàng ở Đà Nẵng. Lớn nhất là Sông Hàn Roastery với 41 đơn trong 6 tháng qua.',
  },
]

export function useFakeAgent() {
  const [messages, setMessages] = useState<Message[]>(SEED)
  const [status, setStatus] = useState<AgentStatus>('idle')
  // id timer + id tin nhắn đang chạy: cần nhớ, không cần vẽ → ref
  const timers = useRef<number[]>([])
  const currentId = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  // Rời trang giữa chừng → dọn timer (S1.2: có mở là có tắt)
  useEffect(() => clearTimers, [clearTimers])

  const patch = (id: string, fn: (m: Message) => Message) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))

  const send = useCallback(
    (question: string) => {
      const script = SCRIPTS.find((s) => s.match.test(question))!
      const botId = crypto.randomUUID()
      currentId.current = botId
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', text: question },
        { id: botId, role: 'assistant', text: '', tool: { ...script.tool, output: undefined, status: 'running' } },
      ])
      setStatus('tool')

      // 1) tool chạy xong sau 1,5 giây
      timers.current.push(
        window.setTimeout(() => {
          patch(botId, (m) => ({ ...m, tool: { ...m.tool!, status: 'done', output: script.tool.output } }))
          setStatus('streaming')
          // 2) stream câu trả lời, mỗi chữ 45ms
          script.answer.split(' ').forEach((word, i, all) => {
            timers.current.push(
              window.setTimeout(() => {
                patch(botId, (m) => ({ ...m, text: m.text ? `${m.text} ${word}` : word }))
                if (i === all.length - 1) {
                  setStatus('idle')
                  currentId.current = null
                }
              }, 45 * (i + 1)),
            )
          })
        }, 1500),
      )
    },
    [],
  )

  const stop = useCallback(() => {
    clearTimers()
    const id = currentId.current
    if (id) {
      patch(id, (m) => ({
        ...m,
        stopped: true,
        tool: m.tool && m.tool.status === 'running' ? { ...m.tool, status: 'stopped' } : m.tool,
      }))
    }
    currentId.current = null
    setStatus('idle')
  }, [clearTimers])

  return { messages, status, send, stop }
}
