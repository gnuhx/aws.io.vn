import { TOOL } from "@nexus/shared";
import type { LlmEvent, LlmProvider, StreamRequest } from "./types.ts";

/**
 * Provider GIẢ LẬP (LLM_PROVIDER=scripted): kịch bản cố định, cùng hợp đồng LlmProvider với provider thật.
 * Dùng khi không có API key (sandbox dựng bài) và trong E2E.
 */
export function createScriptedProvider(): LlmProvider {
  return {
    async *stream(req: StreamRequest, signal: AbortSignal): AsyncIterable<LlmEvent> {
      const last = req.messages.at(-1);
      if (last?.role === "user" && /khách/i.test(last.content) && req.tools.some((t) => t.name === TOOL.listCustomers)) {
        const city = /hà nội|ha noi/i.test(last.content) ? "Hà Nội" : undefined;
        yield { type: "tool_call", call: { id: "call_1", name: TOOL.listCustomers, input: city ? { city, limit: 5 } : { limit: 5 } } };
        return;
      }
      let answer = "Mình chưa hiểu câu hỏi.";
      // Câu "X là gì?": trả lời từ glossary mà HOST đã đưa vào system prompt — không cần tool
      const term = last?.role === "user" ? /^(.+?) là gì\??$/i.exec(last.content.trim())?.[1] : undefined;
      const def = term ? req.system.split("\n").find((l) => l.toLowerCase().includes(`**${term.toLowerCase()}`)) : undefined;
      if (def) answer = def.replace(/^- /, "").replaceAll("**", "");
      if (last?.role === "tool") {
        const total = /"total":(\d+)/.exec(last.content)?.[1];
        answer = last.isError ? "Công cụ báo lỗi, mình không đoán số liệu." : `Có ${total ?? "?"} khách hàng.`;
      }
      for (const word of answer.split(" ")) {
        if (signal.aborted) return;
        yield { type: "text", delta: word + " " };
        await new Promise((r) => setTimeout(r, 20));
      }
      yield { type: "end" };
    },
  };
}
