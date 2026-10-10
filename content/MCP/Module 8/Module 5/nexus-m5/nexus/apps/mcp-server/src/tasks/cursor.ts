import { createHash } from "node:crypto";
import { z } from "zod";
import type { TaskFilter, TaskKey } from "./repository.ts";

/**
 * Cursor mờ (opaque) cho keyset pagination (M5 · S5.5).
 * Bên trong: vị trí cuối trang trước + dấu vân tay của bộ lọc. Model chỉ việc chép nguyên văn.
 * Không phải số trang/offset: chèn/xóa giữa chừng không làm trùng hay sót bản ghi còn tồn tại.
 * (M6 · S6.4 thêm hạn dùng + chữ ký để phân biệt cursor hết hạn với cursor bị sửa.)
 */
const CursorBody = z.object({ v: z.literal(1), c: z.string(), i: z.string(), f: z.string() });

export function filterFingerprint(f: TaskFilter): string {
  const stable = JSON.stringify([f.status ?? null, f.assignee ?? null, f.customerId ?? null, f.dueBefore ?? null]);
  return createHash("sha256").update(stable).digest("base64url").slice(0, 12);
}

export function encodeCursor(last: TaskKey, f: TaskFilter): string {
  return Buffer.from(JSON.stringify({ v: 1, c: last.createdAt, i: last.id, f: filterFingerprint(f) })).toString("base64url");
}

export type Decoded = { ok: true; after: TaskKey } | { ok: false; reason: "malformed" | "other_filter" };

export function decodeCursor(raw: string, f: TaskFilter): Decoded {
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const p = CursorBody.safeParse(body);
  if (!p.success) return { ok: false, reason: "malformed" };
  if (p.data.f !== filterFingerprint(f)) return { ok: false, reason: "other_filter" };
  return { ok: true, after: { createdAt: p.data.c, id: p.data.i } };
}
