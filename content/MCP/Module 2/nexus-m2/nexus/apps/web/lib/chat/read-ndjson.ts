import { ChatEventSchema, type ChatEvent } from "@nexus/shared";

/**
 * Đọc body NDJSON thành từng ChatEvent. Chạy được cả trong trình duyệt lẫn Node.
 * Chunk mạng KHÔNG trùng ranh giới dòng: 1 chunk có thể chứa nửa dòng → phải giữ buffer.
 */
export async function* readNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  const dec = new TextDecoder(); // { stream: true } bên dưới: giữ lại byte UTF-8 bị cắt giữa 2 chunk
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        const ev = ChatEventSchema.safeParse(JSON.parse(line));
        if (ev.success) yield ev.data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
