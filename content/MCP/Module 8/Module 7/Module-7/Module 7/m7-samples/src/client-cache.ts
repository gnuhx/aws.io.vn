/**
 * S7.5 — phía client (host ở M11 dùng lại): tôn trọng `ttlMs` theo spec 2026-07-28 · Caching.
 * - thiếu / âm / không phải số → coi như 0 (cũ ngay)
 * - tươi khi now < t_received + ttlMs; hết hạn → tải lại KHI CẦN (không tự poll nền)
 * - list_changed tới → invalidate() ngay
 * - tải lại lỗi mà còn bản cũ → được dùng bản cũ (spec: MAY serve stale)
 */
export function ttlOf(result: Record<string, unknown>): number {
  const t = result["ttlMs"];
  return typeof t === "number" && Number.isFinite(t) && t > 0 ? t : 0;
}

export function createTtlCache<T extends Record<string, unknown>>(load: () => Promise<T>, now: () => number = Date.now) {
  let entry: { value: T; freshUntil: number } | undefined;
  let fetches = 0;
  return {
    async get(): Promise<{ value: T; from: "cache" | "network" | "stale" }> {
      if (entry && now() < entry.freshUntil) return { value: entry.value, from: "cache" };
      try {
        fetches++;
        const value = await load();
        entry = { value, freshUntil: now() + ttlOf(value) };
        return { value, from: "network" };
      } catch (e) {
        if (entry) return { value: entry.value, from: "stale" };
        throw e;
      }
    },
    invalidate() {
      entry = undefined;
    },
    fetches: () => fetches,
  };
}
