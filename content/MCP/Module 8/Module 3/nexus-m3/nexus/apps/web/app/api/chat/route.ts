import { ChatRequestSchema } from "@nexus/shared";
import { answer } from "../../../lib/chat/orchestrate.ts";
import { toNdjsonStream } from "../../../lib/chat/ndjson.ts";
import { mcpHost } from "../../../lib/mcp/host.ts";

// Spawn process con (MCP stdio) → không chạy được trên Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Tin nhắn không hợp lệ." }, { status: 400 });

  const { tools } = await mcpHost();
  const events = answer(parsed.data.message, tools, req.signal);
  const body = toNdjsonStream(events, (err) => {
    process.stderr.write(`[nexus-web] chat error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
