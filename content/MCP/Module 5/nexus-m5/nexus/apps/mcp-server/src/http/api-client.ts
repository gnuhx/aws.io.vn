import type { z } from "zod";
import type { Logger } from "../log.ts";

/**
 * Client HTTP dùng chung cho mọi API bên thứ ba (M5 · S5.3).
 *  - Auth header lấy qua hàm (token xoay vòng được), không dán cứng.
 *  - 429/503: tôn trọng Retry-After. Chờ nếu ngắn và còn ngân sách; dài thì trả lỗi NGAY kèm số giây.
 *  - Lỗi mạng / 5xx / timeout: chỉ thử lại khi an toàn (GET, hoặc POST có Idempotency-Key), backoff mũ + jitter.
 *  - Ngân sách thời gian cho cả lời gọi (budgetMs): tool không bao giờ treo quá mức này.
 */
export type ApiErrorKind = "auth" | "not_found" | "bad_request" | "rate_limited" | "unavailable" | "timeout" | "bad_response";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Bên kia bảo đợi bao lâu (đã quy ra ms) — chỉ có với rate_limited / unavailable. */
  readonly retryAfterMs: number | undefined;
  constructor(kind: ApiErrorKind, message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export interface RetryPolicy {
  /** Tổng số lần gửi, tính cả lần đầu. */
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry-After dài hơn mức này → không chờ, trả lỗi ngay. */
  maxWaitMs: number;
  /** Thời gian tối đa cho cả lời gọi, gồm mọi lần thử và thời gian chờ. */
  budgetMs: number;
}

export interface ApiClientOptions {
  name: string;
  baseUrl: string;
  timeoutMs: number;
  retry: RetryPolicy;
  auth?: () => Record<string, string>;
  log?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  now?: () => number;
}

export interface RequestOptions<S extends z.ZodType> {
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** POST chỉ được thử lại khi có key — bên kia nhận key trùng thì trả kết quả cũ, không tạo bản 2. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
}

/** Retry-After: số giây ("30") hoặc HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value.trim()) * 1_000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - now);
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

export function createApiClient(o: ApiClientOptions): ApiClient {
  const doFetch = o.fetch ?? fetch;
  const sleep = o.sleep ?? defaultSleep;
  const random = o.random ?? Math.random;
  const now = o.now ?? Date.now;

  async function request<S extends z.ZodType>(method: "GET" | "POST", path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
    const url = new URL(path, o.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
    const retrySafe = method === "GET" || opts.idempotencyKey !== undefined;
    const started = now();
    const budget = AbortSignal.timeout(o.retry.budgetMs);
    const outer = opts.signal ? AbortSignal.any([opts.signal, budget]) : budget;

    for (let attempt = 1; ; attempt++) {
      const left = o.retry.budgetMs - (now() - started);
      const backoff = (): number => Math.round(random() * Math.min(o.retry.maxDelayMs, o.retry.baseDelayMs * 2 ** (attempt - 1)));
      /** Chờ rồi thử lại nếu còn lượt + còn ngân sách; không thì ném lỗi. */
      const retryOrThrow = async (wait: number, err: ApiError): Promise<void> => {
        if (attempt >= o.retry.maxAttempts || wait > left - o.timeoutMs) throw err;
        o.log?.warn("api retry", { api: o.name, attempt, waitMs: wait, reason: err.kind, status: err.status });
        await sleep(wait, outer);
      };

      const headers: Record<string, string> = { accept: "application/json", ...(o.auth?.() ?? {}) };
      if (opts.body !== undefined) headers["content-type"] = "application/json";
      if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
      const attemptSignal = AbortSignal.any([outer, AbortSignal.timeout(Math.min(o.timeoutMs, Math.max(1, left)))]);

      let res: Response;
      try {
        res = await doFetch(url, { method, headers, signal: attemptSignal, ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}) });
      } catch {
        if (opts.signal?.aborted) throw new ApiError("timeout", `${o.name}: lời gọi bị hủy.`);
        const kind = attemptSignal.aborted ? "timeout" : "unavailable";
        const err = new ApiError(kind, kind === "timeout" ? `${o.name} không trả lời kịp.` : `Không kết nối được ${o.name}.`);
        if (!retrySafe) throw err; // POST không key: có thể bên kia ĐÃ xử lý — thử lại là tạo trùng
        await retryOrThrow(backoff(), err);
        continue;
      }

      if (res.ok) {
        const body: unknown = await res.json().catch(() => undefined);
        const parsed = opts.schema.safeParse(body);
        if (!parsed.success) throw new ApiError("bad_response", `${o.name} trả dữ liệu không đúng định dạng.`, res.status);
        return parsed.data;
      }

      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) throw new ApiError("auth", `${o.name} từ chối xác thực (HTTP ${res.status}).`, res.status);
      if (res.status === 404) throw new ApiError("not_found", `${o.name}: không tìm thấy.`, res.status);
      if (res.status === 400 || res.status === 422) throw new ApiError("bad_request", `${o.name} từ chối dữ liệu: ${detail.slice(0, 200)}`, res.status);
      if (res.status === 429 || res.status === 503) {
        const ra = parseRetryAfter(res.headers.get("retry-after"), now());
        const kind = res.status === 429 ? "rate_limited" : "unavailable";
        const err = new ApiError(kind, `${o.name} ${res.status === 429 ? "đang giới hạn tần suất" : "tạm quá tải"}.`, res.status, ra);
        // 429: bên kia CHƯA xử lý request → thử lại an toàn cả với POST. 503 không chắc → theo retrySafe.
        if (res.status === 503 && !retrySafe) throw err;
        if (ra !== undefined && ra > o.retry.maxWaitMs) throw err; // chờ quá lâu: trả về ngay để tool không treo
        await retryOrThrow(ra ?? backoff(), err);
        continue;
      }
      const err = new ApiError("unavailable", `${o.name} lỗi HTTP ${res.status}.`, res.status);
      if (!retrySafe || res.status < 500) throw err;
      await retryOrThrow(backoff(), err);
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, opts) => request("POST", path, opts),
  };
}
