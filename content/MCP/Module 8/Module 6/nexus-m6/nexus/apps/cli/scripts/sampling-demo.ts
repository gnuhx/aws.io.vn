/**
 * nexus_enrich_customer qua 7 kiểu client — server Nexus thật (stdio), mỗi kiểu 1 phiên.
 *   node scripts/sampling-demo.ts
 * Kịch bản 7 gọi API Anthropic thật với key sai → 401 thật (cần mạng ra api.anthropic.com).
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { connect, NEXUS_SERVER, type ConnectOptions } from "../src/connect.ts";
import { providerFromFlag } from "../src/llm/index.ts";
import { APPROVERS, enableSampling, type Approver } from "../src/sampling.ts";

const quiet = (): void => {};
const loud = (s: string): void => void process.stderr.write(`${s}\n`);
interface Case {
  label: string;
  id: string;
  apply?: boolean;
  llm?: string;
  approve?: Approver;
  env?: Record<string, string>;
}
const CASES: Case[] = [
  { label: "client không khai báo sampling", id: "cus_026" },
  { label: "sampling, người dùng duyệt", id: "cus_026", llm: "scripted:enrich", approve: APPROVERS.auto(loud) },
  { label: "sampling, người dùng từ chối", id: "cus_029", llm: "scripted:enrich", approve: APPROVERS.deny(quiet) },
  { label: "LLM trả ```json + câu dẫn, apply=true", id: "cus_027", apply: true, llm: "scripted:enrich-fenced", approve: APPROVERS.auto(quiet) },
  { label: "LLM trả giá trị ngoài tập", id: "cus_028", llm: "scripted:enrich-invalid", approve: APPROVERS.auto(quiet) },
  { label: "người duyệt chậm 1500 ms, server chờ 500 ms", id: "cus_030", llm: "scripted:enrich", approve: APPROVERS.slow(quiet, 1500), env: { NEXUS_SAMPLING_TIMEOUT_MS: "500" } },
  { label: "LLM thật (Anthropic), API key sai", id: "cus_026", llm: "anthropic", approve: APPROVERS.auto(quiet) },
];

const data = (r: CallToolResult): Record<string, unknown> => (r.structuredContent ?? {}) as Record<string, unknown>;
let n = 0;
for (const c of CASES) {
  n++;
  const opts: ConnectOptions = {};
  if (c.llm && c.approve) {
    const llm = providerFromFlag(c.llm, { ANTHROPIC_API_KEY: "sk-ant-khong-hop-le", NEXUS_LLM_MODEL: "claude-haiku-5-5" });
    const approve = c.approve;
    opts.capabilities = { sampling: {} };
    opts.setup = (cl) => enableSampling(cl, llm, approve);
  }
  const s = await connect({ ...NEXUS_SERVER, env: { NEXUS_LOG_LEVEL: "error", ...c.env } }, opts);
  const t0 = performance.now();
  const r = await s.client.callTool({ name: "nexus_enrich_customer", arguments: { id: c.id, apply: c.apply ?? false } });
  const ms = Math.round(performance.now() - t0);
  if ("toolResult" in r) throw new Error("định dạng cũ");
  const d = data(r);
  const sug = d.suggestion as { city: string | null; industry: string | null } | undefined;
  console.log(`${n}. ${c.label} (${c.id}, ${ms} ms)`);
  console.log(`   source=${String(d.source)} · city=${sug?.city ?? "null"} · industry=${sug?.industry ?? "null"} · applied=${JSON.stringify(d.applied)}`);
  console.log(`   note: ${String(d.note)}`);
  if (c.apply) {
    const g = data((await s.client.callTool({ name: "nexus_get_customer", arguments: { id: c.id } })) as CallToolResult);
    console.log(`   → nexus_get_customer ${c.id}: city=${String(g.city)} · industry=${String(g.industry)}`);
  }
  await s.close();
}
