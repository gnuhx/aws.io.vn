import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
export type ReportProgress = (progress: number, total?: number, message?: string) => Promise<void>;

/**
 * Client chỉ muốn nhận progress khi gửi _meta.progressToken. Không có token → trả hàm rỗng (Null Object):
 * handler gọi report() thoải mái, không cần if, và không gửi notification nào.
 */
export function progressReporter(extra: ToolExtra): ReportProgress {
  const token = extra._meta?.progressToken;
  if (token === undefined) return async () => {};
  let last = Number.NEGATIVE_INFINITY;
  return async (progress, total, message) => {
    if (progress <= last) return; // spec: progress PHẢI tăng dần
    last = progress;
    await extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken: token, progress, ...(total !== undefined && { total }), ...(message !== undefined && { message }) },
    });
  };
}
