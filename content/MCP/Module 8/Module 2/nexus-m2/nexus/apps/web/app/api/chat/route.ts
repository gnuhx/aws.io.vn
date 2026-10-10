import { ChatRequestSchema } from "@nexus/shared";
import { answer } from "@/lib/chat/orchestrate.ts";
import { toNdjsonStream } from "@/lib/chat/ndjson.ts";
import { llm } from "@/lib/llm/index.ts";
import { callMcpTool, mcpHost } from "@/lib/mcp/host.ts";

// Spawn process con + SDK Node → bắt buộc runtime Node, không phải Edge.
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "message phải là chuỗi 1–4000 ký tự" }, { status: 400 });
  }

  const { tools } = await mcpHost();
  const events = answer(parsed.data.message, { llm: llm(), tools, callTool: callMcpTool }, req.signal);

  const stream = toNdjsonStream(events, (err) => {
    console.error("[chat] stream failed", err); // log đầy đủ ở server
    return "Có lỗi khi tạo câu trả lời. Thử lại sau."; // client chỉ nhận câu an toàn
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // Nginx: đừng gom response lại (S2.5)
    },
  });
}
