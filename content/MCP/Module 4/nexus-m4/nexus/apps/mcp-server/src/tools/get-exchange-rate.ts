import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeRateInputSchema, ExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { describeRatesError } from "../rates/client.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerGetExchangeRate(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá",
      description:
        "Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy về VND) từ dịch vụ bên ngoài. " +
        "Gọi khi người dùng hỏi tỷ giá hoặc cần quy đổi tiền. Không tự đoán tỷ giá khi tool lỗi.",
      inputSchema: ExchangeRateInputSchema.shape,
      outputSchema: ExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ base, quote }, extra) => {
      const r = await deps.rates.latest(base, quote, extra.signal);
      if (!r.ok) {
        deps.log.warn("rates failed", { error: r.error });
        return toolFail(describeRatesError(r.error));
      }
      return toolOk(ExchangeRateOutputSchema, r.value);
    }),
  );
}
