import type { CURRENCIES } from "@nexus/shared";
import { z } from "zod";
import { ApiError, createApiClient } from "../http/api-client.ts";

export type Currency = (typeof CURRENCIES)[number];
export interface Rate {
  from: Currency;
  rate: number;
  asOf: string;
}

/** Lỗi đã dịch sẵn thành câu LLM đọc được (M3 · S3.4). */
export class RatesError extends Error {
  readonly kind: "timeout" | "unavailable" | "bad_response";
  constructor(kind: RatesError["kind"], message: string) {
    super(message);
    this.name = "RatesError";
    this.kind = kind;
  }
}

export interface RatesClient {
  get(from: Currency, signal?: AbortSignal): Promise<Rate>;
}

const RateBody = z.object({ rate: z.number().positive(), asOf: z.string().optional() });

/** M5 · S5.3: dùng client HTTP chung (timeout, retry GET có backoff, Retry-After) thay fetch tự viết. */
export function createRatesClient(baseUrl: string, timeoutMs: number, fetchImpl: typeof fetch = fetch): RatesClient {
  const api = createApiClient({
    name: "Dịch vụ tỷ giá",
    baseUrl,
    timeoutMs,
    fetch: fetchImpl,
    retry: { maxAttempts: 2, baseDelayMs: 200, maxDelayMs: 1_000, maxWaitMs: 2_000, budgetMs: timeoutMs + 1_500 },
  });
  return {
    async get(from, signal) {
      try {
        const body = await api.get(`/rates/${from}`, { schema: RateBody, ...(signal ? { signal } : {}) });
        return { from, rate: body.rate, asOf: body.asOf ?? new Date().toISOString() };
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        if (err.kind === "timeout") throw new RatesError("timeout", `Dịch vụ tỷ giá không trả lời trong ${timeoutMs / 1000} giây.`);
        if (err.kind === "bad_response") throw new RatesError("bad_response", "Dịch vụ tỷ giá trả dữ liệu không đúng định dạng.");
        throw new RatesError("unavailable", err.status ? `Dịch vụ tỷ giá trả lỗi HTTP ${err.status}.` : "Không kết nối được dịch vụ tỷ giá.");
      }
    },
  };
}
