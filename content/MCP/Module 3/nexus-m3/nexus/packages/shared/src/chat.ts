import { z } from "zod";

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** Sự kiện stream NDJSON từ /api/chat về trình duyệt — mỗi dòng 1 event. */
export type ChatEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; ok: boolean; ms: number }
  | { type: "error"; message: string }
  | { type: "done" };

export const ChatEventSchema: z.ZodType<ChatEvent> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({ type: z.literal("tool_start"), name: z.string(), input: z.unknown() }),
  z.object({ type: z.literal("tool_end"), name: z.string(), ok: z.boolean(), ms: z.number() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);
