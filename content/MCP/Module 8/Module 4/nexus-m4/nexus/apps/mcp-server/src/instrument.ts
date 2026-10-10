import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator bằng hàm bậc cao: đo giờ, log ok/fail, chặn exception lạ.
 * Chữ ký giữ nguyên (A suy ra từ ngữ cảnh registerTool) → handler bên trong vẫn có type từ inputSchema.
 */
export function instrument<A extends unknown[]>(
  name: string,
  log: Logger,
  handler: (...args: A) => Promise<CallToolResult>,
): (...args: A) => Promise<CallToolResult> {
  return async (...args: A) => {
    const t0 = performance.now();
    try {
      const res = await handler(...args);
      const ms = Math.round(performance.now() - t0);
      if (res.isError) log.warn("tool failed", { tool: name, ms });
      else log.debug("tool ok", { tool: name, ms });
      return res;
    } catch (err) {
      // Stack cho người vận hành (stderr); model chỉ nhận câu chung — không lộ nội bộ.
      log.error("tool crashed", { tool: name, err: err instanceof Error ? err.stack : String(err) });
      return toolFail({
        what: `Tool ${name} gặp lỗi nội bộ.`,
        next: "Đừng thử lại ngay với cùng tham số; báo người dùng là hệ thống đang lỗi.",
      });
    }
  };
}
