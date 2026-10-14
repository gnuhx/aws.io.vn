import { z } from "zod";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Event stream từ /api/chat về trình duyệt (NDJSON, 1 event / dòng)
export type ChatEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; isError: boolean; ms: number }
  | { type: "error"; message: string }
  | { type: "done" };
