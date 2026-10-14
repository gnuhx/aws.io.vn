import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { TaskFilter } from "@nexus/shared";
import type { TaskKey } from "./repository.ts";

/**
 * Cursor v2 (S6.4): `<payload base64url>.<chữ ký>`.
 * payload = {v, c, i, f, exp}: vị trí keyset + vân tay bộ lọc + hạn dùng. KHÔNG có: số trang, offset, tổng,
 * giá trị bộ lọc thô (có thể là dữ liệu cá nhân), thông tin nội bộ DB.
 * Thứ tự kiểm: chữ ký → hình dạng → hạn → bộ lọc. Hạn chỉ có nghĩa khi chữ ký đúng (không thì ai cũng sửa được exp).
 */
const Payload = z.object({
  v: z.literal(2),
  c: z.iso.datetime(),
  i: z.string().regex(/^task_\d{4,}$/),
  f: z.string().length(12),
  exp: z.number().int().positive(), // epoch giây
});

export type Decoded =
  | { ok: true; after: TaskKey }
  | { ok: false; reason: "invalid" } // bị sửa, không phải của Nexus, khóa đã đổi, định dạng cũ
  | { ok: false; reason: "expired"; issuedAt: Date }
  | { ok: false; reason: "other_filter" };

export interface CursorCodec {
  encode(key: TaskKey, f: TaskFilter): string;
  decode(cursor: string, f: TaskFilter): Decoded;
}

/** Vân tay bộ lọc: cursor của danh sách A không dùng được cho danh sách B. */
export function filterPrint(f: TaskFilter): string {
  const canon = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(canon).digest("base64url").slice(0, 12);
}

const SIG_LEN = 32; // 32 ký tự base64url = 192 bit — đủ, và giữ cursor ngắn cho model chép lại

export function createCursorCodec(opts: { secret: Buffer; ttlMs: number; now: () => Date }): CursorCodec {
  const sign = (payload: string): string => createHmac("sha256", opts.secret).update(payload).digest("base64url").slice(0, SIG_LEN);
  return {
    encode(key, f) {
      const exp = Math.floor((opts.now().getTime() + opts.ttlMs) / 1000);
      const payload = Buffer.from(JSON.stringify({ v: 2, c: key.createdAt, i: key.id, f: filterPrint(f), exp })).toString("base64url");
      return `${payload}.${sign(payload)}`;
    },
    decode(cursor, f) {
      const dot = cursor.indexOf(".");
      if (dot < 1) return { ok: false, reason: "invalid" };
      const payload = cursor.slice(0, dot);
      const given = Buffer.from(cursor.slice(dot + 1));
      const want = Buffer.from(sign(payload));
      // timingSafeEqual ném RangeError nếu 2 buffer khác độ dài → so độ dài trước
      if (given.length !== want.length || !timingSafeEqual(given, want)) return { ok: false, reason: "invalid" };
      let raw: unknown;
      try {
        raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      } catch {
        return { ok: false, reason: "invalid" };
      }
      const p = Payload.safeParse(raw);
      if (!p.success) return { ok: false, reason: "invalid" };
      if (p.data.exp * 1000 <= opts.now().getTime()) {
        return { ok: false, reason: "expired", issuedAt: new Date(p.data.exp * 1000 - opts.ttlMs) };
      }
      if (p.data.f !== filterPrint(f)) return { ok: false, reason: "other_filter" };
      return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
    },
  };
}
