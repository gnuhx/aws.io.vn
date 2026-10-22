/**
 * BẪY S8.3 · 2 — phản xạ .NET `AddConsoleExporter()` trên server stdio. ConsoleSpanExporter in ra STDOUT,
 * mà stdout của server stdio là kênh JSON-RPC (M2). Client nhận rác giữa các message.
 *   node traps/s83-console-exporter.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

if (process.argv[2] === "--serve") {
  const provider = new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())] });
  provider.register();
  const tracer = provider.getTracer("nexus");
  const server = new McpServer({ name: "console-exporter", version: "1.0.0" });
  server.registerTool("ping", { description: "ping" }, async () =>
    tracer.startActiveSpan("tools/call ping", async (span) => {
      span.end(); // exporter in span ra stdout NGAY lúc này
      return { content: [{ type: "text" as const, text: "pong" }] };
    }),
  );
  await server.connect(new StdioServerTransport());
} else {
  const client = new Client({ name: "trap", version: "1.0.0" });
  let bad = 0;
  client.onerror = (e) => {
    if (++bad <= 3) console.log(`client.onerror #${bad}: ${e.message.split("\n")[0]?.slice(0, 110)}`);
  };
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [process.argv[1] ?? "", "--serve"] }));
  const r = await client.callTool({ name: "ping" });
  console.log(`kết quả tool: ${(r.content as { text: string }[])[0]?.text} · dòng rác trên stdout: ${bad}`);
  await client.close();
}
