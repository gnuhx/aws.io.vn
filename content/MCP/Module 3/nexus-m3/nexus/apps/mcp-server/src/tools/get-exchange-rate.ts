import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExchangeRateInputSchema, ExchangeRateOutputSchema, TOOL } from "@nexus/shared";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import type { RatesClient, RatesError } from "../rates/client.ts";
import { toolFail, toolOk, type ToolFailure } from "../tool-result.ts";

export interface ExchangeRateDeps {
  rates: RatesClient;
  log: Logger;
}

/** Anti-corruption: lỗi thô của mạng/API ngoài → câu LLM đọc được. Không stack trace, không URL nội bộ. */
export function describeRatesError(e: RatesError): ToolFailure {
  switch (e.kind) {
    case "timeout":
      return { what: `Dịch vụ tỷ giá không phản hồi trong ${e.ms / 1000} giây.`, next: "Thử lại sau ít phút. Không tự đoán tỷ giá; nói rõ với người dùng là chưa lấy được." };
    case "cancelled":
      return { what: "Yêu cầu tỷ giá đã bị hủy.", next: "Không cần làm gì thêm." };
    case "network":
    case "upstream":
      return { what: "Dịch vụ tỷ giá đang lỗi hoặc không truy cập được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "bad_response":
      return { what: "Dịch vụ tỷ giá trả dữ liệu không đọc được.", next: "Thử lại sau; nếu vẫn lỗi, báo người dùng là nguồn tỷ giá đang có vấn đề." };
    case "unknown_currency":
      return { what: `Nguồn tỷ giá không có mã tiền tệ '${e.code}'.`, next: "Kiểm tra lại mã ISO 4217 (ví dụ USD, EUR, JPY, VND) rồi gọi lại." };
  }
}

export function registerGetExchangeRate(server: McpServer, deps: ExchangeRateDeps): void {
  server.registerTool(
    TOOL.getExchangeRate,
    {
      title: "Tỷ giá ngoại tệ",
      description:
        "Lấy tỷ giá mới nhất giữa 2 loại tiền (mặc định quy đổi sang VND) từ dịch vụ bên ngoài. " +
        "Gọi khi cần quy đổi số tiền hoặc so sánh giá theo ngoại tệ. Tỷ giá cập nhật ~1 lần/ngày.",
      inputSchema: ExchangeRateInputSchema.shape,
      outputSchema: ExchangeRateOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.getExchangeRate, deps.log, async ({ base, quote }, extra) => {
      const r = await deps.rates.latest(base, quote, extra.signal);
      if (!r.ok) {
        deps.log.warn("exchange rate failed", { base, quote, error: r.error });
        return toolFail(describeRatesError(r.error));
      }
      return toolOk(ExchangeRateOutputSchema, r.value);
    }),
  );
}
