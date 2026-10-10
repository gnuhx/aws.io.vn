/**
 * Client tỷ giá theo hợp đồng open.er-api.com v6: GET {base}/latest/{CODE}.
 * Không ném exception ra ngoài: mọi thất bại thành 1 nhánh của RatesResult (union) để tool dịch sang câu cho LLM.
 */
import { z } from "zod";
import type { ExchangeRate } from "@nexus/shared";

const ApiResponse = z.union([
  z.object({
    result: z.literal("success"),
    base_code: z.string(),
    time_last_update_utc: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
  z.object({ result: z.literal("error"), "error-type": z.string() }),
]);

export type RatesError =
  | { kind: "timeout"; ms: number }
  | { kind: "cancelled" }
  | { kind: "network"; detail: string }
  | { kind: "upstream"; status: number }
  | { kind: "bad_response"; detail: string }
  | { kind: "unknown_currency"; code: string };

export type RatesResult = { ok: true; value: ExchangeRate } | { ok: false; error: RatesError };

export interface RatesClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tiêm fetch để test thay bằng bản giả (C50 Lab 06 cũng stub fetch). */
  fetch?: typeof fetch;
}

export interface RatesClient {
  latest(base: string, quote: string, signal?: AbortSignal): Promise<RatesResult>;
}

export function createRatesClient(opts: RatesClientOptions): RatesClient {
  const doFetch = opts.fetch ?? fetch;
  const source = new URL(opts.baseUrl).host;
  return {
    async latest(base, quote, signal) {
      const timeout = AbortSignal.timeout(opts.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(`${opts.baseUrl}/latest/${encodeURIComponent(base)}`, {
          signal: combined,
          headers: { accept: "application/json" },
        });
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        if (signal?.aborted) return { ok: false, error: { kind: "cancelled" } };
        const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String(err);
        return { ok: false, error: { kind: "network", detail: cause } };
      }
      if (res.status === 404) return { ok: false, error: { kind: "unknown_currency", code: base } };
      if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

      let json: unknown;
      try {
        json = await res.json();
      } catch (err) {
        if (timeout.aborted) return { ok: false, error: { kind: "timeout", ms: opts.timeoutMs } };
        return { ok: false, error: { kind: "bad_response", detail: err instanceof Error ? err.message : String(err) } };
      }
      const parsed = ApiResponse.safeParse(json);
      if (!parsed.success) return { ok: false, error: { kind: "bad_response", detail: parsed.error.issues[0]?.message ?? "schema" } };
      const body = parsed.data;
      if (body.result === "error") {
        return body["error-type"] === "unsupported-code"
          ? { ok: false, error: { kind: "unknown_currency", code: base } }
          : { ok: false, error: { kind: "bad_response", detail: body["error-type"] } };
      }
      const rate = body.rates[quote];
      if (rate === undefined) return { ok: false, error: { kind: "unknown_currency", code: quote } };
      return {
        ok: true,
        value: { base, quote, rate, asOf: new Date(body.time_last_update_utc).toISOString(), source },
      };
    },
  };
}
