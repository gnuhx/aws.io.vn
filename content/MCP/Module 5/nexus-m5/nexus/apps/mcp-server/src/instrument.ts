import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "./log.ts";
import { toolFail } from "./tool-result.ts";

/**
 * Decorator cho handler tool (M3 · S3.5): đo thời gian, log ra stderr,
 * chặn mọi exception không lường trước → câu chung, không lộ nội bộ.
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
      log.info("tool", { tool: name, ms: Math.round(performance.now() - t0), isError: res.isError === true });
      return res;
    } catch (err) {
      log.error("tool crashed", { tool: name, err: err instanceof Error ? (err.stack ?? err.message) : String(err) });
      return toolFail({ what: `Tool ${name} gặp lỗi nội bộ.`, next: "Thử lại một lần; nếu vẫn lỗi, báo người dùng thay vì đoán kết quả." });
    }
  };
}
