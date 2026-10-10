import { ChatRequestSchema, type ChatEvent } from "@nexus/shared";
import { createScriptedProvider } from "../../../lib/llm/scripted.ts";
import type { LlmMessage, LlmProvider } from "../../../lib/llm/types.ts";
import { getHost } from "../../../lib/mcp/host.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_STEPS = 4;
const SYSTEM = "Bạn là trợ lý dữ liệu của Nexus. Chỉ trả lời dựa trên kết quả tool; tool lỗi thì nói thẳng, không đoán số.";

function provider(): LlmProvider {
  // Provider thật (Anthropic/OpenAI) nằm sau cùng interface — sandbox dựng bài dùng bản giả lập.
  return createScriptedProvider();
}

export async function POST(req: Request): Promise<Response> {
  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Body không hợp lệ" }, { status: 400 });

  const host = await getHost();
  const llm = provider();
  const enc = new TextEncoder();
  const signal = req.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: ChatEvent): void => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      const messages: LlmMessage[] = [...parsed.data.messages];
      try {
        for (let step = 0; step < MAX_STEPS; step++) {
          let called = false;
          const system = host.context() ? `${SYSTEM}\n\n<glossary>\n${host.context()}\n</glossary>` : SYSTEM;
          for await (const ev of llm.stream({ system, messages, tools: host.tools() }, signal)) {
            if (ev.type === "text") send({ type: "text", delta: ev.delta });
            if (ev.type === "tool_call") {
              called = true;
              send({ type: "tool_start", name: ev.call.name, input: ev.call.input });
              const t0 = performance.now();
              const r = await host.call(ev.call.name, ev.call.input, signal);
              send({ type: "tool_end", name: ev.call.name, isError: r.isError, ms: Math.round(performance.now() - t0) });
              messages.push({ role: "tool", toolCallId: ev.call.id, name: ev.call.name, content: r.text, isError: r.isError });
            }
          }
          if (!called) break;
        }
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: signal.aborted ? "Đã dừng." : "Có lỗi khi xử lý câu hỏi." });
        console.error(err);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
