import type { ChatEvent } from "@nexus/shared";

/**
 * Async generator → ReadableStream NDJSON (1 event / dòng). pull = backpressure: client chưa đọc thì không kéo event kế.
 * Lỗi: log đầy đủ ở server (onError), client chỉ nhận 1 câu chung.
 */
export function toNdjsonStream(events: AsyncGenerator<ChatEvent>, onError: (err: unknown) => void): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const line = (e: ChatEvent) => enc.encode(JSON.stringify(e) + "\n");
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) { controller.close(); return; }
        controller.enqueue(line(value));
      } catch (err) {
        onError(err);
        controller.enqueue(line({ type: "error", message: "Có lỗi khi tạo câu trả lời. Thử lại sau." }));
        controller.enqueue(line({ type: "done" }));
        controller.close();
      }
    },
    async cancel() {
      await events.return(undefined);
    },
  });
}
