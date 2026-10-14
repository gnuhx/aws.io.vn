/** Log ra stderr — không bao giờ ra stdout (stdout là kênh JSON-RPC của stdio transport). */
export type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export function createLogger(min: Level, write: (line: string) => void = (l) => process.stderr.write(l)): Logger {
  const emit = (level: Level) => (msg: string, data?: Record<string, unknown>) => {
    if (ORDER[level] < ORDER[min]) return;
    write(`${JSON.stringify({ t: new Date().toISOString(), level, msg, ...data })}\n`);
  };
  return { debug: emit("debug"), info: emit("info"), warn: emit("warn"), error: emit("error") };
}
