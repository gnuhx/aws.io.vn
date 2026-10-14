/**
 * nexus-mcp — client MCP dòng lệnh: liệt kê và gọi bất kỳ thứ gì 1 server khai báo.
 *
 *   node src/main.ts [--server "<lệnh khởi động>"] [--server-env K=V]… [--trace]
 *                    [--llm anthropic|scripted:<kịch bản>] [--approve auto|deny|slow:<ms>]
 *                    [--elicit yes|no|decline|cancel] [--root <thư mục>]… [--roots-static] <lệnh> [...]
 *     caps                    serverInfo, phiên bản giao thức, capability, instructions
 *     tools                   tools/list (+ annotation R/D/I/O)
 *     call <tool> [json]      tools/call
 *     resources               resources/list + resources/templates/list
 *     read <uri>              resources/read
 *     prompts                 prompts/list
 *     prompt <name> [json]    prompts/get
 *     complete <ref> <arg> [giá trị] [context json]
 *                             completion/complete; ref = prompt:<tên> | resource:<uri template>
 */
import { parseArgs } from "node:util";
import type { ClientCapabilities } from "@modelcontextprotocol/sdk/types.js";
import { connect, NEXUS_SERVER, parseServerSpec, type ConnectOptions, type Session } from "./connect.ts";
import { renderCaps, renderContent, renderTool, renderToolResult, renderTrace } from "./format.ts";
import { providerFromFlag } from "./llm/index.ts";
import { ELICIT_MODES, enableElicitation, isElicitMode } from "./elicit.ts";
import { enableRoots } from "./roots.ts";
import { APPROVERS, enableSampling, type Approver } from "./sampling.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    server: { type: "string" },
    "server-env": { type: "string", multiple: true, default: [] },
    trace: { type: "boolean", default: false },
    llm: { type: "string" },
    approve: { type: "string", default: "auto" },
    elicit: { type: "string" },
    root: { type: "string", multiple: true, default: [] },
    "roots-static": { type: "boolean", default: false },
  },
});
const [cmd, ...rest] = positionals;
const out = (line: string): void => void process.stdout.write(`${line}\n`);
const json = (s: string | undefined): Record<string, unknown> => (s ? (JSON.parse(s) as Record<string, unknown>) : {});

const COMMANDS: Record<string, (s: Session, args: string[]) => Promise<number>> = {
  async caps(s) {
    const info = s.client.getServerVersion();
    out(`server       ${info?.name ?? "?"} ${info?.version ?? "?"}${info?.title ? ` (“${info.title}”)` : ""}`);
    out(`protocol     ${s.protocolVersion ?? "?"}`);
    out("capabilities:");
    renderCaps(s.client.getServerCapabilities()).forEach(out);
    out(`instructions ${s.client.getInstructions() ?? "—"}`);
    return 0;
  },
  async tools(s) {
    const r = await s.client.listTools();
    r.tools.forEach((t) => out(renderTool(t)));
    out(`(${r.tools.length} tool · R=readOnly D=destructive I=idempotent O=openWorld)`);
    return 0;
  },
  async call(s, [name, args]) {
    if (!name) throw new Error("thiếu tên tool");
    await s.client.listTools(); // bước "list": SDK chỉ kiểm structuredContent theo outputSchema của tool đã liệt kê
    const r = await s.client.callTool({ name, arguments: json(args) });
    if ("toolResult" in r) throw new Error("server trả định dạng 2024-10-07 (toolResult) — client này không hỗ trợ");
    out(renderToolResult(r));
    return r.isError ? 1 : 0;
  },
  async resources(s) {
    const [list, templates] = await Promise.all([s.client.listResources(), s.client.listResourceTemplates()]);
    list.resources.forEach((r) => out(`${r.uri.padEnd(30)} ${r.name}${r.mimeType ? `  (${r.mimeType})` : ""}`));
    templates.resourceTemplates.forEach((t) => out(`${t.uriTemplate.padEnd(30)} ${t.name}  [template]`));
    return 0;
  },
  async read(s, [uri]) {
    if (!uri) throw new Error("thiếu uri");
    const r = await s.client.readResource({ uri });
    r.contents.forEach((c) => out("text" in c ? c.text : `<blob ${c.mimeType ?? "?"} ${c.blob.length} ký tự base64>`));
    return 0;
  },
  async prompts(s) {
    const r = await s.client.listPrompts();
    for (const p of r.prompts) {
      const args = (p.arguments ?? []).map((a) => `${a.name}${a.required ? "" : "?"}`).join(", ");
      out(`${p.name}(${args})  ${p.description ?? ""}`);
    }
    return 0;
  },
  async prompt(s, [name, args]) {
    if (!name) throw new Error("thiếu tên prompt");
    const r = await s.client.getPrompt({ name, arguments: json(args) as Record<string, string> });
    out(`description: ${r.description ?? "—"}`);
    r.messages.forEach((m, i) => out(`[${i}] ${m.role}: ${renderContent(m.content)}`));
    return 0;
  },
  async complete(s, [ref, arg, value = "", ctx]) {
    const m = /^(prompt|resource):(.+)$/.exec(ref ?? "");
    if (!m?.[2] || !arg) throw new Error("dùng: complete prompt:<tên>|resource:<uri template> <argument> [giá trị] [context json]");
    const r = await s.client.complete({
      ref: m[1] === "prompt" ? { type: "ref/prompt", name: m[2] } : { type: "ref/resource", uri: m[2] },
      argument: { name: arg, value },
      ...(ctx ? { context: { arguments: json(ctx) as Record<string, string> } } : {}),
    });
    const c = r.completion;
    out(`${JSON.stringify(value)} → ${c.values.length} gợi ý · total=${c.total ?? "—"} · hasMore=${String(c.hasMore ?? false)}`);
    out(`  ${c.values.slice(0, 8).join(", ")}${c.values.length > 8 ? ", …" : ""}`);
    return 0;
  },
};

const run = cmd ? COMMANDS[cmd] : undefined;
if (!run) {
  process.stderr.write(`lệnh: ${Object.keys(COMMANDS).join(" | ")}\n`);
  process.exit(2);
}
const log = (s: string): void => void process.stderr.write(`${s}\n`);
function approver(flag: string): Approver {
  if (flag === "auto") return APPROVERS.auto(log);
  if (flag === "deny") return APPROVERS.deny(log);
  const ms = /^slow:(\d+)$/.exec(flag)?.[1];
  if (ms) return APPROVERS.slow(log, Number(ms));
  throw new Error(`--approve "${flag}" không hợp lệ: auto | deny | slow:<ms>`);
}

const spec = {
  ...(values.server ? parseServerSpec(values.server) : NEXUS_SERVER),
  env: Object.fromEntries(values["server-env"].map((kv) => [kv.slice(0, kv.indexOf("=")), kv.slice(kv.indexOf("=") + 1)])),
};
// capability khai báo TRƯỚC bắt tay — server đọc nó trong initialize, sau đó không đổi được
const capabilities: ClientCapabilities = {};
const setups: ((c: Session["client"]) => void)[] = [];
if (values.llm) {
  const llm = providerFromFlag(values.llm);
  const approve = approver(values.approve);
  capabilities.sampling = {};
  setups.push((c) => enableSampling(c, llm, approve));
}
if (values.elicit) {
  const mode = values.elicit;
  if (!isElicitMode(mode)) throw new Error(`--elicit "${mode}": ${ELICIT_MODES.join(" | ")}`);
  capabilities.elicitation = { form: {} };
  setups.push((c) => enableElicitation(c, mode, log));
}
if (values.root.length) {
  const notify = !values["roots-static"];
  capabilities.roots = { listChanged: notify };
  setups.push((c) => void enableRoots(c, values.root, notify));
}
const opts: ConnectOptions = { capabilities, setup: (c) => setups.forEach((f) => f(c)) };
if (values.trace) opts.trace = (d, m) => log(renderTrace(d, m));
const session = await connect(spec, opts);
let code = 1;
try {
  code = await run(session, rest);
} catch (e) {
  out(`[protocol error] ${e instanceof Error ? e.message : String(e)}`);
} finally {
  await session.close();
}
process.exit(code);
