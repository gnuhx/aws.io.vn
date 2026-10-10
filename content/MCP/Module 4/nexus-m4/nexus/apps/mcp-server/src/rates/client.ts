import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

// Hợp đồng open.er-api.com v6 — CHỈ tồn tại trong file này (anti-corruption layer).
const V6Success = z.object({
  result: z.literal("success"),
  base_code: z.string(),
  time_last_update_utc: z.string(),
  rates: z.record(z.string(), z.number()),
});
const V6Error = z.object({ result: z.literal("error"), "error-type": z.string() });
const V6Body = z.union([V6Success, V6Error]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; cause: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm được — test thay bằng hàm giả (C50 Lab 06 chấm đúng kiểu này). */
  fetch?: typeof fetch;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const fail = (error: RatesError): RatesResult => ({ ok: false, error });
      const aborted = (): RatesResult | undefined =>
        timeout.aborted ? fail({ kind: "timeout", ms: opts.timeoutMs }) : signal?.aborted ? fail({ kind: "cancelled" }) : undefined;

      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, { signal: combined });
      } catch (err) {
        const why = aborted();
        if (why) return why;
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return fail({ kind: "network", cause });
      }
      if (res.status === 404) return fail({ kind: "unknown_currency", code: base });
      if (!res.ok) return fail({ kind: "upstream", status: res.status });

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        return aborted() ?? fail({ kind: "bad_response", detail: err instanceof Error ? err.message : String(err) });
      }
      const body = V6Body.safeParse(json);
      if (!body.success) return fail({ kind: "bad_response", detail: "sai hình dạng" });
      if (body.data.result === "error") {
        const t = body.data["error-type"];
        return t === "unsupported-code" ? fail({ kind: "unknown_currency", code: base }) : fail({ kind: "upstream", status: res.status });
      }
      const rate = body.data.rates[quote];
      if (rate === undefined) return fail({ kind: "unknown_currency", code: quote });
      return {
        ok: true,
        value: { base: body.data.base_code, quote, rate, asOf: new Date(body.data.time_last_update_utc).toISOString(), source },
      };
    },
  };
}

/** Union lỗi → câu cho model: chuyện gì + làm gì tiếp. Thêm kind mới mà quên nhánh → tsc báo. */
export function describeRatesError(e: RatesError): { what: string; next: string } {
  switch (e.kind) {
    case "timeout":
      return { what: `Dịch vụ tỷ giá không phản hồi trong ${Math.round(e.ms / 1000)} giây.`, next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "cancelled":
      return { what: "Yêu cầu tỷ giá đã bị hủy.", next: "Không cần làm gì thêm." };
    case "network":
    case "upstream":
      return { what: "Dịch vụ tỷ giá đang lỗi hoặc không truy cập được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "bad_response":
      return { what: "Dịch vụ tỷ giá trả dữ liệu không đọc được.", next: "Thử lại sau ít phút. Không tự đoán tỷ giá." };
    case "unknown_currency":
      return { what: `Không có tỷ giá cho mã tiền tệ '${e.code}'.`, next: "Gọi lại với mã ISO 4217 hợp lệ, ví dụ 'USD', 'EUR', 'VND'." };
  }
}
