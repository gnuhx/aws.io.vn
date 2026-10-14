import { ChatEventSchema, type ChatEvent } from "@nexus/shared";

/** Đọc NDJSON từ fetch body, dùng được cả ở trình duyệt lẫn script Node. */
export async function* readNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  // TextDecoder { stream: true }: ký tự UTF-8 (chữ Việt 2–3 byte) bị cắt giữa 2 chunk vẫn ghép đúng
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    buf += done ? dec.decode() : dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) yield ChatEventSchema.parse(JSON.parse(line));
    }
    if (done) return;
  }
}
