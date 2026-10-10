/**
 * Logger 2 đích:
 *  - stderr: JSON 1 dòng cho người vận hành (Claude Desktop gom vào mcp-server-nexus.log).
 *  - MCP client: notifications/message, lọc theo mức client đặt bằng logging/setLevel.
 * stdout là kênh JSON-RPC — KHÔNG sink nào được ghi vào đó.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LoggingLevelSchema, SetLevelRequestSchema, type LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

export type Level = "debug" | "info" | "warn" | "error";
export type LogData = Record<string, unknown>;
export type LogSink = (level: Level, msg: string, data?: LogData) => void;

export interface Logger {
  debug(msg: string, data?: LogData): void;
  info(msg: string, data?: LogData): void;
  warn(msg: string, data?: LogData): void;
  error(msg: string, data?: LogData): void;
}

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function stderrSink(min: Level = "info", out: NodeJS.WritableStream = process.stderr): LogSink {
  return (level, msg, data) => {
    if (RANK[level] < RANK[min]) return;
    out.write(JSON.stringify({ t: new Date().toISOString(), level, msg, ...data }) + "\n");
  };
}

/** MCP có 8 mức (syslog); Nexus dùng 4 — warn ↔ "warning". */
const TO_MCP: Record<Level, LoggingLevel> = { debug: "debug", info: "info", warn: "warning", error: "error" };

/** debug < info < notice < warning < error < critical < alert < emergency */
const SEVERITY: readonly LoggingLevel[] = LoggingLevelSchema.options;

/**
 * Gửi log cho client qua giao thức (notifications/message). Cần capabilities.logging khi tạo server.
 * Tự giữ mức tối thiểu: client gửi logging/setLevel thì theo client; chưa gửi thì dùng defaultLevel
 * (SDK mặc định gửi TẤT CẢ, kể cả debug, khi client chưa chọn mức). stdio = 1 client; HTTP nhiều session là M7.
 */
export function mcpLogSink(server: McpServer, opts: { logger?: string; defaultLevel?: LoggingLevel } = {}): LogSink {
  const logger = opts.logger ?? "nexus";
  let min: LoggingLevel = opts.defaultLevel ?? "info";
  // Không gửi gì trước khi bắt tay xong (notifications/initialized) — spec cấm server "nói trước"
  let initialized = false;
  const prev = server.server.oninitialized;
  server.server.oninitialized = () => {
    initialized = true;
    prev?.();
  };
  server.server.setRequestHandler(SetLevelRequestSchema, async (req) => {
    min = req.params.level;
    return {};
  });
  return (level, msg, data) => {
    const l = TO_MCP[level];
    if (!initialized || SEVERITY.indexOf(l) < SEVERITY.indexOf(min)) return;
    server.sendLoggingMessage({ level: l, logger, data: { msg, ...data } }).catch(() => {});
  };
}

export function createLogger(...initial: LogSink[]): Logger & { attach(sink: LogSink): void } {
  const sinks = [...initial];
  const emit = (level: Level) => (msg: string, data?: LogData) => {
    for (const sink of sinks) sink(level, msg, data);
  };
  return {
    debug: emit("debug"),
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    attach: (sink) => void sinks.push(sink),
  };
}
