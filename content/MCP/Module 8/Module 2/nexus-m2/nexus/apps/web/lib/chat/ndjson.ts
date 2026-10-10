import type { ChatEvent } from "@nexus/shared";

/**
 * AsyncIterable<ChatEvent> → ReadableStream NDJSON (mỗi event 1 dòng JSON).
 * Pull-based: chỉ lấy event kế tiếp khi client đọc kịp → tự có backpressure.
 */
export function toNdjsonStream(events: AsyncIterable<ChatEvent>, onError: (err: unknown) => string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const it = events[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await it.next();
        if (done) return controller.close();
        controller.enqueue(enc.encode(`${JSON.stringify(value)}\n`));
      } catch (err) {
        const ev: ChatEvent = { type: "error", message: onError(err) };
        controller.enqueue(enc.encode(`${JSON.stringify(ev)}\n`));
        controller.close();
      }
    },
    async cancel() {
      await it.return?.(); // client đóng tab → dừng generator, không gọi LLM tiếp
    },
  });
}
