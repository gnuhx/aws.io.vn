/**
 * Mini agent CLI: hỏi 1 câu, agent tự gọi tool của Nexus (hoặc server MCP bất kỳ) cho tới khi trả lời được.
 *
 *   node src/agent.ts [--llm scripted:<kịch bản>|anthropic] [--max-steps 8] [--max-tool-calls N]
 *                     [--deadline-ms N] [--allow-destructive] [--server "<lệnh>"] "<câu hỏi>"
 *
 * Mã thoát: 0 trả lời được · 3 chạm giới hạn · 4 lỗi LLM · 5 hết giờ/hủy.
 */
import { parseArgs } from "node:util";
import { runAgent, type AgentEvent, type AgentResult } from "./agent/loop.ts";
import { connect, NEXUS_SERVER, parseServerSpec } from "./connect.ts";
import { providerFromFlag } from "./llm/index.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    llm: { type: "string", default: "scripted:hanoi-top" },
    "max-steps": { type: "string", default: "8" },
    "max-tool-calls": { type: "string" },
    "deadline-ms": { type: "string" },
    "allow-destructive": { type: "boolean", default: false },
    server: { type: "string" },
  },
});
const question = positionals.join(" ").trim();
if (!question) {
  process.stderr.write('dùng: node src/agent.ts [tùy chọn] "<câu hỏi>"\n');
  process.exit(2);
}
const log = (s: string): void => void process.stderr.write(`${s}\n`);
const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const onEvent = (e: AgentEvent): void => {
  if (e.type === "llm") log(`${CIRCLED[e.step - 1] ?? `(${e.step})`} LLM → ${e.toolUses ? `${e.toolUses} tool_use` : "trả lời"} (${e.stopReason}, ${e.ms} ms)`);
  else {
    log(`   ↳ ${e.name} ${JSON.stringify(e.input)} ${e.isError ? "✗ isError" : "✓"} ${e.ms} ms · ${e.chars} ký tự`);
    if (e.errorText) log(`     “${e.errorText.length > 110 ? `${e.errorText.slice(0, 110)}…` : e.errorText}”`);
  }
};

const llm = providerFromFlag(values.llm);
const session = await connect(values.server ? parseServerSpec(values.server) : NEXUS_SERVER, { name: "nexus-agent" });
const ctrl = new AbortController();
process.on("SIGINT", () => ctrl.abort(new Error("người dùng bấm Ctrl+C")));
const signal = values["deadline-ms"] ? AbortSignal.any([ctrl.signal, AbortSignal.timeout(Number(values["deadline-ms"]))]) : ctrl.signal;

let result: AgentResult;
try {
  result = await runAgent({
    llm,
    mcp: session.client,
    question,
    system: "Bạn là trợ lý dữ liệu của Nexus. Chỉ trả lời bằng số liệu lấy từ tool. Không đoán.",
    maxSteps: Number(values["max-steps"]),
    ...(values["max-tool-calls"] ? { maxToolCalls: Number(values["max-tool-calls"]) } : {}),
    ...(values["allow-destructive"] ? { allowTool: () => true } : {}),
    signal,
    onEvent,
  });
} finally {
  await session.close(); // dừng kiểu gì cũng đóng phiên MCP (process server con)
}

const summary = `${result.status} · ${result.steps} lượt LLM · ${result.toolCalls} tool call · ${result.ms} ms · ${llm.name}`;
switch (result.status) {
  case "answered":
    process.stdout.write(`${result.text}\n`);
    log(`✓ ${summary}`);
    process.exit(0);
    break;
  case "max_steps":
  case "max_tool_calls":
    process.stdout.write(`Dừng: chạm giới hạn (${result.status === "max_steps" ? `${values["max-steps"]} lượt LLM` : `${values["max-tool-calls"]} tool call`}). Chưa có câu trả lời đầy đủ.\n`);
    log(`✗ ${summary}`);
    process.exit(3);
    break;
  case "llm_error":
    process.stdout.write(`Dừng: lỗi LLM (${result.error.kind}) — ${result.error.message}\n`);
    log(`✗ ${summary}`);
    process.exit(4);
    break;
  case "aborted":
    process.stdout.write("Dừng: hết giờ hoặc bị hủy.\n");
    log(`✗ ${summary}`);
    process.exit(5);
}
