/**
 * BẪY S8.3 · 1 — test in-memory "chứng minh" trace nối được, dù client KHÔNG gửi traceparent.
 * InMemoryTransport gọi thẳng hàm trong cùng process → AsyncLocalStorage mang context của client sang server.
 * Qua stdio (process khác) thì không có gì mang sang: span server thành root, cây đứt.
 *   node traps/s83-context-leak.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { trace } from "@opentelemetry/api";
import { InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(new InMemorySpanExporter())] });
provider.register(); // AsyncLocalStorage context manager
const tracer = provider.getTracer("trap");

/** Tool trả về traceId mà SERVER nhìn thấy lúc chạy handler (không đọc _meta — giống server quên extract). */
function makeServer(): McpServer {
  const server = new McpServer({ name: "leak", version: "1.0.0" });
  server.registerTool("whoami", { description: "traceId server thấy" }, async () => ({
    content: [{ type: "text", text: trace.getActiveSpan()?.spanContext().traceId ?? "(không có span active)" }],
  }));
  return server;
}

if (process.argv[2] === "--serve") {
  await makeServer().connect(new StdioServerTransport());
} else {
  const ask = async (label: string, transport: Transport): Promise<void> => {
    const client = new Client({ name: "trap", version: "1.0.0" });
    await client.connect(transport);
    await tracer.startActiveSpan(`client ${label}`, async (span) => {
      const r = await client.callTool({ name: "whoami" }); // KHÔNG gửi _meta.traceparent
      const seen = (r.content as { text: string }[])[0]?.text ?? "";
      const same = seen === span.spanContext().traceId;
      console.log(`${label.padEnd(10)} client trace ${span.spanContext().traceId.slice(0, 12)}… · server thấy ${seen.slice(0, 22)}${seen.length > 22 ? "…" : ""} → ${same ? "NỐI ĐƯỢC (dù không truyền gì)" : "ĐỨT"}`);
      span.end();
    });
    await client.close();
  };
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await makeServer().connect(st);
  await ask("in-memory", ct);
  await ask("stdio", new StdioClientTransport({ command: process.execPath, args: [process.argv[1] ?? "", "--serve"] }));
}
