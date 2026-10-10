import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import type { ToolExtra } from "./progress.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (≈ DelegatingHandler / ActionFilter): đo thời gian, log kết quả,
 * và chặn exception lọt ra ngoài — SDK sẽ gửi nguyên message exception cho LLM nếu ta để nó bay.
 */
export function instrument<A>(
  name: string,
  log: Logger,
  handler: (args: A, extra: ToolExtra) => Promise<CallToolResult>,
): (args: A, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args, extra) => {
    const t0 = performance.now();
    try {
      const res = await handler(args, extra);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      log.error("tool crashed", { tool: name, ms, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi." });
    }
  };
}
