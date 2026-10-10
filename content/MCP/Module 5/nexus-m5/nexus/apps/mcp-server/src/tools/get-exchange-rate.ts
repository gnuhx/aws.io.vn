import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetExchangeRateInputSchema, GetExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { RatesError } from "../rates/client.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerGetExchangeRate(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá sang VND",
      description: "Tỷ giá 1 đơn vị ngoại tệ sang VND từ dịch vụ tỷ giá. Gọi khi cần quy đổi doanh thu/giá ngoại tệ.",
      inputSchema: GetExchangeRateInputSchema.shape,
      outputSchema: GetExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ from }, extra) => {
      try {
        const r = await deps.rates.get(from, extra.signal);
        return toolOk(GetExchangeRateOutputSchema, { from, to: "VND", rate: r.rate, asOf: r.asOf });
      } catch (err) {
        if (err instanceof RatesError) return toolFail({ what: err.message, next: "Thử lại sau; nếu cần gấp, nói rõ với người dùng là chưa có tỷ giá." });
        throw err;
      }
    }),
  );
}
