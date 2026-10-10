import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/** Progress chỉ gửi khi client xin (có progressToken) — M3 · S3.5. */
export function progressReporter(extra: Extra, total: number): (done: number, message: string) => Promise<void> {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => undefined;
  return async (progress, message) => {
    await extra.sendNotification({ method: "notifications/progress", params: { progressToken: token, progress, total, message } });
  };
}
