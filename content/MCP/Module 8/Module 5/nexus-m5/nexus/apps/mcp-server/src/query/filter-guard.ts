import type { QueryCollection } from "@nexus/shared";
import { ALLOWED_FIELD_OPS, ALLOWED_LOGICAL_OPS, FIELDS, LIMITS } from "./catalog.ts";

/**
 * Kiểm filter do LLM gửi lên TRƯỚC khi tới DB (M5 · S5.2).
 * Allow-list: chỉ toán tử + field có trong danh sách mới qua. Không blacklist "$where" — thiếu 1 cái là lọt.
 * Đây là lớp 2. Lớp 1 là user DB chỉ có quyền read (DB tự từ chối ghi, kể cả khi guard có lỗ).
 */
export type Primitive = string | number | boolean | null;
export type GuardResult = { ok: true } | { ok: false; at: string; problem: string };

const FIELD_OPS: ReadonlySet<string> = new Set(ALLOWED_FIELD_OPS);
const LOGICAL_OPS: ReadonlySet<string> = new Set(ALLOWED_LOGICAL_OPS);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/** Lượng từ lồng nhau kiểu (a+)+ — mẫu ReDoS kinh điển. */
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*{]/;

const isPrimitive = (v: unknown): v is Primitive => v === null || ["string", "number", "boolean"].includes(typeof v);
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

export function checkFilter(collection: QueryCollection, filter: Record<string, unknown>): GuardResult {
  let nodes = 0;
  const fail = (at: string, problem: string): GuardResult => ({ ok: false, at, problem });

  function doc(node: Record<string, unknown>, at: string, depth: number): GuardResult {
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    for (const [key, value] of Object.entries(node)) {
      const here = at ? `${at}.${key}` : key;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (FORBIDDEN_KEYS.has(key)) return fail(here, "tên khóa bị cấm");
      if (key.startsWith("$")) {
        if (!LOGICAL_OPS.has(key)) return fail(here, `toán tử ${key} không được phép ở cấp tài liệu (cho phép: ${ALLOWED_LOGICAL_OPS.join(", ")})`);
        if (!Array.isArray(value) || value.length === 0 || value.length > 10) return fail(here, `${key} cần mảng 1–10 điều kiện`);
        for (const [i, sub] of value.entries()) {
          if (!isPlainObject(sub)) return fail(`${here}[${i}]`, "mỗi điều kiện là 1 object");
          const r = doc(sub, `${here}[${i}]`, depth + 1);
          if (!r.ok) return r;
        }
        continue;
      }
      if (!FIELDS[collection].has(key)) return fail(here, `field không có trong ${collection} (có: ${[...FIELDS[collection]].join(", ")})`);
      const r = fieldValue(value, here, depth + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  function fieldValue(value: unknown, at: string, depth: number): GuardResult {
    if (isPrimitive(value)) return { ok: true }; // so khớp bằng
    if (!isPlainObject(value)) return fail(at, "giá trị phải là chuỗi/số/boolean/null hoặc object toán tử");
    if (depth > LIMITS.depth) return fail(at, `lồng quá ${LIMITS.depth} tầng`);
    const keys = Object.keys(value);
    if (keys.length === 0) return fail(at, "object toán tử rỗng");
    for (const op of keys) {
      const here = `${at}.${op}`;
      if (++nodes > LIMITS.nodes) return fail(here, `quá ${LIMITS.nodes} điều kiện`);
      if (!op.startsWith("$")) return fail(here, "so khớp nguyên object con không được hỗ trợ — dùng toán tử");
      if (!FIELD_OPS.has(op)) return fail(here, `toán tử ${op} không được phép (cho phép: ${ALLOWED_FIELD_OPS.join(" ")})`);
      const v = value[op];
      switch (op) {
        case "$in":
        case "$nin":
          if (!Array.isArray(v) || v.length > LIMITS.inSize || !v.every(isPrimitive)) return fail(here, `${op} cần mảng ≤ ${LIMITS.inSize} giá trị đơn`);
          break;
        case "$exists":
          if (typeof v !== "boolean") return fail(here, "$exists cần true/false");
          break;
        case "$regex": {
          if (typeof v !== "string" || v.length > LIMITS.regexLength) return fail(here, `$regex cần chuỗi ≤ ${LIMITS.regexLength} ký tự`);
          if (NESTED_QUANTIFIER.test(v)) return fail(here, "$regex có lượng từ lồng nhau (nguy cơ ReDoS)");
          try {
            new RegExp(v);
          } catch {
            return fail(here, "$regex không hợp lệ");
          }
          break;
        }
        case "$options":
          if (typeof v !== "string" || !/^[imsx]{0,4}$/.test(v)) return fail(here, "$options chỉ gồm i m s x");
          break;
        case "$not": {
          const r = fieldValue(v, here, depth + 1);
          if (!r.ok) return r;
          if (isPrimitive(v)) return fail(here, "$not cần object toán tử");
          break;
        }
        default:
          if (!isPrimitive(v)) return fail(here, `${op} cần giá trị đơn`);
      }
    }
    return { ok: true };
  }

  return doc(filter, "", 1);
}
