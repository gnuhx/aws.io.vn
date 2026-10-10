import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport, TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { ClientCapabilities, JSONRPCMessage, MessageExtraInfo } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "node:url";

/** Cách khởi động 1 MCP server qua stdio — Nexus hay server bất kỳ (C50 Lab 29: client chấm bài). */
export interface ServerSpec {
  command: string;
  args: string[];
  cwd?: string;
  /** Biến môi trường THÊM vào bộ mặc định của SDK (SDK không chuyển toàn bộ process.env cho process con). */
  env?: Record<string, string>;
}

export const NEXUS_SERVER: ServerSpec = {
  command: process.execPath,
  args: [fileURLToPath(new URL("../../mcp-server/src/index.ts", import.meta.url))],
};

/** `--server "node ../c50/lab-29/server.ts"` → ServerSpec. Tách theo khoảng trắng, không hỗ trợ ngoặc kép. */
export function parseServerSpec(line: string): ServerSpec {
  const [command, ...args] = line.trim().split(/\s+/);
  if (!command) throw new Error("--server rỗng");
  return { command: command === "node" ? process.execPath : command, args };
}

export type Direction = "→" | "←";
export type Trace = (dir: Direction, msg: JSONRPCMessage) => void;

/** Transport bọc: ghi lại mọi message JSON-RPC đi/đến — thấy tận mắt connect → list → call. */
class TappedTransport implements Transport {
  private readonly inner: Transport;
  private readonly trace: Trace;
  private handler: ((m: JSONRPCMessage, extra?: MessageExtraInfo) => void) | undefined;

  constructor(inner: Transport, trace: Trace) {
    this.inner = inner;
    this.trace = trace;
  }
  get onmessage(): ((m: JSONRPCMessage, extra?: MessageExtraInfo) => void) | undefined {
    return this.handler;
  }
  set onmessage(h: ((m: JSONRPCMessage, extra?: MessageExtraInfo) => void) | undefined) {
    this.handler = h;
    this.inner.onmessage = (m, extra) => {
      this.trace("←", m);
      h?.(m, extra);
    };
  }
  get onclose(): (() => void) | undefined {
    return this.inner.onclose;
  }
  set onclose(h: (() => void) | undefined) {
    this.inner.onclose = h;
  }
  get onerror(): ((e: Error) => void) | undefined {
    return this.inner.onerror;
  }
  set onerror(h: ((e: Error) => void) | undefined) {
    this.inner.onerror = h;
  }
  get sessionId(): string | undefined {
    return this.inner.sessionId;
  }
  start(): Promise<void> {
    return this.inner.start();
  }
  send(m: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
    this.trace("→", m);
    return this.inner.send(m, options);
  }
  close(): Promise<void> {
    return this.inner.close();
  }
}

export interface Session {
  client: Client;
  /** Phiên bản giao thức server chọn trong `initialize` (client SDK v1 không có getter công khai). */
  protocolVersion: string | undefined;
  /** Đóng 1 lần là đủ; gọi lại không lỗi. */
  close(): Promise<void>;
}

export interface ConnectOptions {
  name?: string;
  capabilities?: ClientCapabilities;
  trace?: Trace;
  /** stderr của server: "inherit" để thấy log, "ignore" để im. */
  stderr?: "inherit" | "ignore";
  /** Đăng ký handler phía client (sampling, elicitation, roots…) TRƯỚC khi bắt tay. */
  setup?: (client: Client) => void;
  /** Lỗi tầng transport (dòng stdout không phải JSON-RPC…) — gắn TRƯỚC connect, không thì lỡ lỗi lúc bắt tay. */
  onError?: (e: Error) => void;
}

export async function connect(spec: ServerSpec, opts: ConnectOptions = {}): Promise<Session> {
  const client = new Client({ name: opts.name ?? "nexus-mcp", version: "0.6.0" }, { capabilities: opts.capabilities ?? {} });
  opts.setup?.(client);
  if (opts.onError) client.onerror = opts.onError;
  let protocolVersion: string | undefined;
  const stdio = new StdioClientTransport({
    command: spec.command,
    args: spec.args,
    ...(spec.cwd ? { cwd: spec.cwd } : {}),
    env: { ...getDefaultEnvironment(), ...spec.env },
    stderr: opts.stderr ?? "ignore",
  });
  const transport = new TappedTransport(stdio, (dir, m) => {
    if (dir === "←" && "result" in m && typeof m.result.protocolVersion === "string") protocolVersion = m.result.protocolVersion;
    opts.trace?.(dir, m);
  });
  await client.connect(transport);
  let closed = false;
  return {
    client,
    get protocolVersion() {
      return protocolVersion;
    },
    async close() {
      if (closed) return;
      closed = true;
      await client.close();
    },
  };
}

/** Loan pattern: mở phiên, cho mượn, LUÔN đóng — kể cả khi fn ném lỗi. (C#: `await using`.) */
export async function withClient<T>(spec: ServerSpec, opts: ConnectOptions, fn: (s: Session) => Promise<T>): Promise<T> {
  const s = await connect(spec, opts);
  try {
    return await fn(s);
  } finally {
    await s.close();
  }
}
