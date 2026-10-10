import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;
export type Report = (progress: number, total?: number, message?: string) => Promise<void>;

/**
 * Null Object: client không gửi progressToken → trả hàm rỗng.
 * Handler gọi report() vô điều kiện; quyết định "có gửi không" nằm ở đây.
 */
export function progressReporter(extra: Extra): Report {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => {};
  let last = -Infinity;
  return async (progress, total, message) => {
    if (progress <= last) return; // spec: progress phải tăng
    last = progress;
    await extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken: token, progress, ...(total !== undefined && { total }), ...(message && { message }) },
    });
  };
}
