import { z } from "zod";

/** Body của POST /api/chat. Dùng chung cho route (validate) và UI (type). */
export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Mỗi dòng NDJSON (JSON trên một dòng) route stream về UI.
 * Discriminated union: UI switch theo `type`, TS tự thu hẹp kiểu.
 */
export const ChatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({ type: z.literal("tool_start"), name: z.string(), input: z.record(z.string(), z.unknown()) }),
  z.object({ type: z.literal("tool_end"), name: z.string(), ok: z.boolean(), ms: z.number() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done") }),
]);
export type ChatEvent = z.infer<typeof ChatEventSchema>;
