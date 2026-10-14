/**
 * Logger tối thiểu: 1 dòng JSON / sự kiện, luôn ghi ra STDERR.
 * Server stdio dùng stdout cho JSON-RPC — một dòng in lạc ra stdout là client parse lỗi.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
}

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(min: LogLevel, sink: NodeJS.WritableStream = process.stderr): Logger {
  const write = (level: LogLevel, msg: string, fields?: LogFields): void => {
    if (ORDER[level] < ORDER[min]) return;
    sink.write(`${JSON.stringify({ t: new Date().toISOString(), level, msg, ...fields })}\n`);
  };
  return {
    debug: (m, f) => write("debug", m, f),
    info: (m, f) => write("info", m, f),
    warn: (m, f) => write("warn", m, f),
    error: (m, f) => write("error", m, f),
  };
}

/** Biến unknown (thứ `catch` nhận được) thành field log an toàn — không đẩy stack ra ngoài process. */
export function errorFields(err: unknown): LogFields {
  if (err instanceof Error) return { err: err.name, errMsg: err.message };
  return { err: "NonError", errMsg: String(err) };
}
