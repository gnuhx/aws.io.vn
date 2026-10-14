import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Không bao giờ ghi stdout: stdout là kênh JSON-RPC (M2 · S2.1, M3 · S3.5). */
export type Level = "debug" | "info" | "warning" | "error";
export type Fields = Record<string, string | number | boolean | undefined>;

export interface Logger {
  debug(msg: string, f?: Fields): void;
  info(msg: string, f?: Fields): void;
  warn(msg: string, f?: Fields): void;
  error(msg: string, f?: Fields): void;
  /** Sink thứ 2: gửi notifications/message cho client (theo logging/setLevel của client). */
  attach(server: McpServer): void;
}

const RANK: Record<Level, number> = { debug: 0, info: 1, warning: 2, error: 3 };

export function createLogger(min: Level = "info"): Logger {
  let mcp: McpServer | undefined;
  const write = (level: Level, msg: string, f: Fields = {}): void => {
    if (RANK[level] < RANK[min]) return;
    process.stderr.write(`${JSON.stringify({ t: new Date().toISOString(), level, msg, ...f })}\n`);
    if (mcp?.isConnected()) {
      void mcp.server.sendLoggingMessage({ level, logger: "nexus", data: { msg, ...f } }).catch(() => undefined);
    }
  };
  return {
    debug: (m, f) => write("debug", m, f),
    info: (m, f) => write("info", m, f),
    warn: (m, f) => write("warning", m, f),
    error: (m, f) => write("error", m, f),
    attach: (s) => {
      mcp = s;
    },
  };
}
