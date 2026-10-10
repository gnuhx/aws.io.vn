// S7.1 — Streamable HTTP có session: nhìn tận dây (HTTP thô), rồi dùng client SDK, rồi so với stdio.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ACCEPT_BOTH, check, cut, initBody, raw, ROOT, startServer, summary } from "./lib.ts";

const PORT = "3101";
const URL_ = `http://127.0.0.1:${PORT}/mcp`;
const srv = await startServer({ MODE: "stateful", PORT, INSTANCE: "A" });
const sseData = (body: string) => body.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("");

console.log("— HTTP thô —");
const init = await raw(URL_, { body: initBody(), headers: ACCEPT_BOTH });
const sid = String(init.headers["mcp-session-id"] ?? "");
console.log(`POST initialize                 → ${init.status} ${init.headers["content-type"]} · Mcp-Session-Id: ${sid}`);
console.log(`  ${cut(sseData(init.body), 130)}`);
check(init.status === 200 && /^[0-9a-f-]{36}$/.test(sid), "initialize trả session id");

const s = { ...ACCEPT_BOTH, "mcp-session-id": sid, "mcp-protocol-version": "2025-11-25" };
const inited = await raw(URL_, { body: { jsonrpc: "2.0", method: "notifications/initialized" }, headers: s });
console.log(`POST notifications/initialized  → ${inited.status} (notification: không có body)`);

const noSid = await raw(URL_, { body: { jsonrpc: "2.0", id: 1, method: "tools/list" }, headers: ACCEPT_BOTH });
console.log(`POST tools/list, KHÔNG session  → ${noSid.status} ${cut(noSid.body, 100)}`);
check(noSid.status === 400, "thiếu session → 400");

const badSid = await raw(URL_, { body: { jsonrpc: "2.0", id: 1, method: "tools/list" }, headers: { ...s, "mcp-session-id": "00000000-0000-0000-0000-000000000000" } });
console.log(`POST tools/list, session lạ     → ${badSid.status} ${cut(badSid.body, 100)}`);
check(badSid.status === 404, "session không tồn tại → 404 (client phải initialize lại)");

const noAccept = await raw(URL_, { body: { jsonrpc: "2.0", id: 2, method: "tools/list" }, headers: { ...s, accept: "application/json" } });
console.log(`POST tools/list, Accept thiếu SSE → ${noAccept.status} ${cut(noAccept.body, 100)}`);
check(noAccept.status === 406, "Accept phải có cả application/json và text/event-stream → 406");

const list = await raw(URL_, { body: { jsonrpc: "2.0", id: 3, method: "tools/list" }, headers: s });
const names = (JSON.parse(sseData(list.body)) as { result: { tools: { name: string }[] } }).result.tools.map((t) => t.name);
console.log(`POST tools/list, đúng session   → ${list.status} ${list.headers["content-type"]} · ${names.join(", ")}`);

const del = await raw(URL_, { method: "DELETE", headers: s });
const after = await raw(URL_, { body: { jsonrpc: "2.0", id: 4, method: "tools/list" }, headers: s });
console.log(`DELETE /mcp                     → ${del.status}; gọi lại cùng session → ${after.status}`);
check(del.status === 200 && after.status === 404, "DELETE kết thúc session");

console.log("\n— Client SDK (StreamableHTTPClientTransport) —");
const client = new Client({ name: "s71", version: "1" }, { capabilities: { elicitation: {} } });
client.setRequestHandler(ElicitRequestSchema, async (r) => {
  console.log(`  ← server hỏi người dùng (elicitation qua SSE của session): "${r.params.message}" → đồng ý`);
  return { action: "accept", content: { confirm: true } };
});
const transport = new StreamableHTTPClientTransport(new URL(URL_));
await client.connect(transport);
console.log(`connect → sessionId ${transport.sessionId} · protocol ${transport.protocolVersion}`);
const who = await client.callTool({ name: "nexus_whoami", arguments: {} });
console.log(`nexus_whoami → ${JSON.stringify(who.structuredContent)}`);
const delTask = await client.callTool({ name: "nexus_delete_task", arguments: { id: "t2" } });
console.log(`nexus_delete_task t2 → ${JSON.stringify(delTask.structuredContent)}`);
check((delTask.structuredContent as { deleted?: boolean } | undefined)?.deleted === true, "server → client request (elicitation) chạy được trong mode có session");
await transport.terminateSession();
await client.close();

console.log("\n— Cùng buildServer() qua stdio —");
const stdio = new Client({ name: "s71-stdio", version: "1" });
await stdio.connect(new StdioClientTransport({ command: process.execPath, args: ["src/stdio.ts"], cwd: ROOT, stderr: "ignore" }));
const stdioNames = (await stdio.listTools()).tools.map((t) => t.name);
const httpClient = new Client({ name: "s71b", version: "1" });
await httpClient.connect(new StreamableHTTPClientTransport(new URL(URL_)));
const httpNames = (await httpClient.listTools()).tools.map((t) => t.name);
console.log(`stdio: ${stdioNames.join(", ")}`);
console.log(`http : ${httpNames.join(", ")}`);
check(JSON.stringify(stdioNames) === JSON.stringify(httpNames), "2 transport, 1 định nghĩa tool, cùng danh sách");
await stdio.close();
await httpClient.close();

console.log(`log server: ${srv.logs.join(" | ")}`);
await srv.stop();
summary("S7.1");
