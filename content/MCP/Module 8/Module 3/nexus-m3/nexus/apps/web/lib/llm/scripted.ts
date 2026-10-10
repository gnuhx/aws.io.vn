import { TOOL } from "@nexus/shared";
import type { LlmEvent, LlmProvider, StreamRequest } from "./types.ts";

export interface ScriptedOptions {
  delayMs: number;
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });

/**
 * Provider giả lập có kịch bản — không phải LLM. Dùng khi không có API key (dev, CI, E2E).
 * Lượt 1: câu hỏi có "khách" → đề nghị gọi nexus_list_customers. Lượt 2: đọc 'total' từ kết quả tool, trả lời từng từ.
 */
export function createScriptedProvider(opts: ScriptedOptions): LlmProvider {
  return {
    name: "scripted",
    async *stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const last = req.messages.at(-1);
      if (last?.role === "user" && /khách/i.test(last.content) && req.tools.some((t) => t.name === TOOL.listCustomers)) {
        const city = /hà nội|ha noi/i.test(last.content) ? "Hà Nội" : undefined;
        yield { type: "tool_call", call: { id: "call_1", name: TOOL.listCustomers, input: city ? { city, limit: 5 } : { limit: 5 } } };
        yield { type: "end" };
        return;
      }
      let answer = "Mình chỉ là provider giả lập, hãy hỏi về khách hàng.";
      if (last?.role === "tool") {
        const first = last.results[0];
        const total = first && !first.isError ? (JSON.parse(first.content) as { total?: number }).total : undefined;
        answer = total === undefined ? "Không đọc được dữ liệu khách hàng." : `Theo dữ liệu hiện có, có ${total} khách hàng khớp câu hỏi của bạn.`;
      }
      for (const word of answer.split(" ")) {
        await sleep(opts.delayMs, signal);
        yield { type: "text", delta: word + " " };
      }
      yield { type: "end" };
    },
  };
}
