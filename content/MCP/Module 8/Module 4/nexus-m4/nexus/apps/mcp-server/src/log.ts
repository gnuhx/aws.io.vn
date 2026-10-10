import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SetLevelRequestSchema, type LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

// Thứ tự mức log của MCP (kiểu syslog). So sánh bằng chỉ số.
const LEVELS: readonly LoggingLevel[] = ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"];
const rank = (l: LoggingLevel): number => LEVELS.indexOf(l);

export type LogFields = Record<string, unknown>;
export type LogSink = (level: LoggingLevel, msg: string, fields: LogFields) => void;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  attach(sink: LogSink): void;
}

export function createLogger(...initial: LogSink[]): Logger {
  const sinks = [...initial];
  const emit = (level: LoggingLevel, msg: string, fields: LogFields = {}): void => {
    for (const s of sinks) s(level, msg, fields);
  };
  return {
    debug: (m, f) => emit("debug", m, f),
    info: (m, f) => emit("info", m, f),
    warn: (m, f) => emit("warning", m, f),
    error: (m, f) => emit("error", m, f),
    attach: (s) => void sinks.push(s),
  };
}

/** Log cho người vận hành: JSON 1 dòng ra STDERR. Không bao giờ stdout (kênh JSON-RPC của stdio). */
export function stderrSink(min: LoggingLevel): LogSink {
  return (level, msg, fields) => {
    if (rank(level) < rank(min)) return;
    process.stderr.write(JSON.stringify({ t: new Date().toISOString(), level, msg, ...fields }) + "\n");
  };
}

/**
 * Log cho CLIENT qua notifications/message. Client chọn mức bằng logging/setLevel.
 * SDK 1.30 gửi MỌI mức khi client chưa setLevel → tự giữ mức mặc định `info`.
 * Không gửi gì trước notifications/initialized (server không được "nói trước").
 */
export function mcpLogSink(server: McpServer, initial: LoggingLevel = "info"): LogSink {
  let min: LoggingLevel = initial;
  let ready = false;
  server.server.setRequestHandler(SetLevelRequestSchema, async (req) => {
    min = req.params.level;
    return {};
  });
  const prev = server.server.oninitialized;
  server.server.oninitialized = () => {
    ready = true;
    prev?.();
  };
  return (level, msg, fields) => {
    if (!ready || rank(level) < rank(min)) return;
    void server
      .sendLoggingMessage({ level, logger: "nexus", data: { msg, ...fields } })
      .catch(() => undefined); // kết nối đã đóng: bỏ qua
  };
}
