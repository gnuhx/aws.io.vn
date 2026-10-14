import type { LlmEvent, LlmProvider, LlmRequest } from "./types.ts";

/**
 * Provider giả lập có kịch bản — KHÔNG phải LLM. Dùng khi chưa có API key và trong test E2E.
 * Lượt 1: nếu có tool list_customers và câu hỏi nhắc tới thành phố → gọi tool.
 * Lượt 2: đọc kết quả tool, trả lời, stream từng từ như LLM thật.
 */
const CITY_HINTS = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ"];

function lastUserText(req: LlmRequest): string {
  for (let i = req.messages.length - 1; i >= 0; i--) {
    const m = req.messages[i];
    if (m?.role === "user") return m.content;
  }
  return "";
}

function totalFrom(json: string): number | undefined {
  try {
    const v: unknown = JSON.parse(json);
    if (typeof v === "object" && v !== null && "total" in v && typeof v.total === "number") return v.total;
  } catch {
    /* kết quả không phải JSON → coi như không có số */
  }
  return undefined;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });

export function createScriptedProvider(opts: { delayMs?: number } = {}): LlmProvider {
  const delay = opts.delayMs ?? 60;
  return {
    name: "scripted",
    async *stream(req: LlmRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const last = req.messages.at(-1);
      let answer: string;
      if (last?.role === "tool") {
        const r = last.results[0];
        const total = r ? totalFrom(r.content) : undefined;
        answer = r?.isError || total === undefined
          ? "Mình chưa lấy được dữ liệu khách hàng, bạn thử lại sau nhé."
          : `Theo dữ liệu hiện có, có ${total} khách hàng thỏa điều kiện bạn hỏi.`;
      } else {
        const q = lastUserText(req);
        const city = CITY_HINTS.find((c) => q.toLowerCase().includes(c.toLowerCase()));
        if (city && req.tools.some((t) => t.name === "list_customers")) {
          yield { type: "tool_call", call: { id: "call_1", name: "list_customers", input: { city, limit: 5 } } };
          yield { type: "end", stopReason: "tool_use" };
          return;
        }
        answer = "Mình là bản giả lập: hãy hỏi về số khách hàng ở một thành phố, ví dụ Hà Nội.";
      }
      for (const word of answer.split(" ")) {
        await sleep(delay, signal);
        yield { type: "text", delta: `${word} ` };
      }
      yield { type: "end", stopReason: "end_turn" };
    },
  };
}
