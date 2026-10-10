import { spawn, type ChildProcess } from "node:child_process";
import { request as httpRequest, createServer, type IncomingHttpHeaders } from "node:http";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Chạy `node src/main.ts` (hoặc entry khác) như process thật, đợi tới khi nó báo đã listen. */
export function startServer(env: Record<string, string>, entry = "src/main.ts"): Promise<{ proc: ChildProcess; logs: string[]; stop: () => Promise<number | null> }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [entry], { cwd: ROOT, env: { PATH: process.env["PATH"] ?? "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
    const logs: string[] = [];
    const stop = () =>
      new Promise<number | null>((r) => {
        if (proc.exitCode !== null) return r(proc.exitCode);
        proc.once("exit", (c) => r(c));
        proc.kill("SIGTERM");
      });
    const t = setTimeout(() => reject(new Error(`server không lên: ${logs.join(" | ")}`)), 8000);
    proc.stderr?.on("data", (b: Buffer) => {
      for (const l of b.toString().split("\n").filter(Boolean)) {
        logs.push(l);
        if (l.includes("MCP ") && l.includes(" tại ")) {
          clearTimeout(t);
          resolve({ proc, logs, stop });
        }
      }
    });
    proc.once("exit", (code) => {
      clearTimeout(t);
      reject(new Error(`server thoát (code ${code}): ${logs.join(" | ")}`));
    });
  });
}

export type RawResponse = { status: number; headers: IncomingHttpHeaders; body: string };

/** HTTP thô bằng node:http — đặt được cả Host (fetch thì không cho), để thấy đúng thứ trên dây. */
export function raw(url: string, opts: { method?: string; headers?: Record<string, string>; body?: unknown } = {}): Promise<RawResponse> {
  const u = new URL(url);
  const body = opts.body === undefined ? undefined : JSON.stringify(opts.body);
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method ?? (body ? "POST" : "GET"),
        headers: { ...(body ? { "content-type": "application/json" } : {}), ...opts.headers } },
      (res) => {
        let data = "";
        res.on("data", (c: Buffer) => (data += c.toString()));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data }));
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export const ACCEPT_BOTH = { accept: "application/json, text/event-stream" };

export function initBody(id = 0) {
  return { jsonrpc: "2.0", id, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "raw-http", version: "1" } } };
}

/** Cắt cho vừa 1 dòng terminal. */
export const cut = (s: string, n = 110) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Load balancer round-robin tí hon (thay ALB/Nginx upstream) — ghi lại request nào đi instance nào. */
export function roundRobin(port: number, targets: number[]) {
  let i = 0;
  const hits: string[] = [];
  const server = createServer((req, res) => {
    const target = targets[i++ % targets.length] ?? targets[0] ?? 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      let method = req.method ?? "?";
      try {
        const j: unknown = JSON.parse(body.toString() || "null");
        if (j && typeof j === "object" && "method" in j && typeof j.method === "string") method = j.method;
      } catch { /* không phải JSON */ }
      hits.push(`${method} → :${target}`);
      const up = httpRequest({ host: "127.0.0.1", port: target, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${target}` } }, (ur) => {
        res.writeHead(ur.statusCode ?? 502, ur.headers);
        ur.pipe(res);
      });
      up.on("error", () => res.writeHead(502).end());
      res.on("close", () => up.destroy()); // client đi thì cắt luôn phía sau (giống Nginx)
      up.end(body);
    });
  });
  return new Promise<{ hits: string[]; close: () => void }>((r) =>
    server.listen(port, "127.0.0.1", () => r({ hits, close: () => (server.closeAllConnections(), server.close()) })),
  );
}

let fails = 0;
let total = 0;
export function check(ok: boolean, label: string, detail = "") {
  total++;
  if (!ok) fails++;
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `  ${detail}` : ""}`);
}
export function summary(name: string): never {
  console.log(fails === 0 ? `OK: ${name} ${total}/${total}` : `FAILED: ${name} ${total - fails}/${total}`);
  process.exit(fails === 0 ? 0 : 1);
}
