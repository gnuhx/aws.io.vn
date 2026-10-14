export type ToolStatus = 'running' | 'done' | 'stopped'

export type ToolCall = {
  name: string // tên tool MCP, vd nexus_list_customers
  label: string // mô tả cho người: "Tra danh sách khách hàng"
  status: ToolStatus
  input: Record<string, unknown>
  output?: string
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  tool?: ToolCall
  stopped?: boolean
}

/** idle: chờ câu hỏi · tool: đang chạy tool · streaming: đang in câu trả lời */
export type AgentStatus = 'idle' | 'tool' | 'streaming'
