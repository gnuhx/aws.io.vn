// node scripts/rate-demo.ts — server Nexus thật (stdio) gọi helpdesk giả lập có rate limit qua HTTP thật.
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "@nexus/shared";
import type { AddressInfo } from "node:net";
import { connect } from "./client.ts";
import { startHelpdeskStub, type StubOptions } from "./stub/helpdesk.ts";

const TOKEN = "dev-helpdesk-token";

async function scenario(title: string, stubOpts: Omit<StubOptions, "port" | "token">, token: string, run: (c: Client) => Promise<void>): Promise<void> {
  const stub = await startHelpdeskStub({ port: 0, token: TOKEN, ...stubOpts });
  const url = `http://127.0.0.1:${(stub.server.address() as AddressInfo).port}`;
  const client = await connect({ HELPDESK_URL: url, HELPDESK_TOKEN: token });
  console.log(`\n== ${title}`);
  await run(client);
  console.log(`   helpdesk thấy: ${stub.stats.requests} request · ${stub.stats.rejected429} lần 429 · tạo ${stub.stats.created} · trả lại ${stub.stats.replayed}`);
  await client.close();
  stub.server.close();
}

async function timed(c: Client, name: string, args: Record<string, unknown>): Promise<string> {
  const t0 = performance.now();
  const r = (await c.callTool({ name, arguments: args })) as CallToolResult;
  const ms = Math.round(performance.now() - t0);
  const text = r.content.map((x) => (x.type === "text" ? x.text : "")).join("");
  const body = r.isError ? `[isError] ${text}` : summarize(r.structuredContent);
  return `${String(ms).padStart(5)} ms  ${body}`;
}

function summarize(s: unknown): string {
  const o = s as { total?: number; created?: boolean; ticket?: { id: string } };
  if (o.ticket) return `ticket ${o.ticket.id} · created=${o.created}`;
  return `total=${o.total}`;
}

await scenario("1 · 8 lời gọi liền nhau, bucket 5 request, hồi 1 request/giây", { capacity: 5, refillPerSec: 1 }, TOKEN, async (c) => {
  for (let i = 1; i <= 8; i++) console.log(`   #${i} ${await timed(c, TOOL.listTickets, { status: "open" })}`);
});

await scenario("2 · bị chặn dài: Retry-After 30 giây (> maxWaitMs 5 s)", { capacity: 1, refillPerSec: 1, retryAfterSec: 30 }, TOKEN, async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
  console.log(`   #2 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("3 · Retry-After dạng HTTP-date", { capacity: 1, refillPerSec: 1, httpDate: true }, TOKEN, async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
  console.log(`   #2 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("4 · token sai", { capacity: 5, refillPerSec: 1 }, "token-cu-da-thu-hoi", async (c) => {
  console.log(`   #1 ${await timed(c, TOOL.listTickets, {})}`);
});

await scenario("5 · tạo ticket 2 lần cùng nội dung (bucket 1: lần 2 dính 429 rồi thử lại)", { capacity: 1, refillPerSec: 1 }, TOKEN, async (c) => {
  const args = { customerId: "cus_007", subject: "Không xuất được hóa đơn", body: "Nút Xuất PDF báo lỗi 500 từ sáng nay.", priority: "high" };
  console.log(`   #1 ${await timed(c, TOOL.createTicket, args)}`);
  console.log(`   #2 ${await timed(c, TOOL.createTicket, args)}`);
});
