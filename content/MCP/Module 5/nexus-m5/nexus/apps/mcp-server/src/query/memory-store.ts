import type { QueryCollection } from "@nexus/shared";
import type { FindOptions, ReadOnlyStore, Row } from "./store.ts";

type Source = () => Promise<readonly Row[]>;

/** Bản RAM cùng hợp đồng với Mongo: tự đánh giá filter (chỉ các toán tử guard cho qua). */
export function createMemoryReadOnlyStore(sources: Record<QueryCollection, Source>): ReadOnlyStore {
  return {
    async find(collection, filter, opts: FindOptions) {
      const rows = (await sources[collection]()).filter((r) => matchDoc(r, filter));
      if (opts.sort) {
        const { field, order } = opts.sort;
        const dir = order === "asc" ? 1 : -1;
        rows.sort((a, b) => dir * compare(a[field], b[field]));
      }
      const pick = (r: Row): Row => (opts.fields ? Object.fromEntries(opts.fields.filter((f) => f in r).map((f) => [f, r[f]])) : { ...r });
      return { matched: rows.length, items: rows.slice(0, opts.limit).map(pick) };
    },
  };
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function matchDoc(row: Row, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([k, v]) => {
    if (k === "$and") return (v as Record<string, unknown>[]).every((f) => matchDoc(row, f));
    if (k === "$or") return (v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    if (k === "$nor") return !(v as Record<string, unknown>[]).some((f) => matchDoc(row, f));
    return matchField(row[k], v, k in row);
  });
}

function sameTypeCmp(a: unknown, b: unknown, ok: (d: number) => boolean): boolean {
  if (typeof a === "number" && typeof b === "number") return ok(a - b);
  if (typeof a === "string" && typeof b === "string") return ok(a < b ? -1 : a > b ? 1 : 0);
  return false; // Mongo: khác kiểu thì không so được
}

function matchField(value: unknown, cond: unknown, present: boolean): boolean {
  if (cond === null || typeof cond !== "object" || Array.isArray(cond)) return value === cond;
  const ops = cond as Record<string, unknown>;
  return Object.entries(ops).every(([op, arg]) => {
    switch (op) {
      case "$eq":
        return value === arg;
      case "$ne":
        return value !== arg;
      case "$gt":
        return sameTypeCmp(value, arg, (d) => d > 0);
      case "$gte":
        return sameTypeCmp(value, arg, (d) => d >= 0);
      case "$lt":
        return sameTypeCmp(value, arg, (d) => d < 0);
      case "$lte":
        return sameTypeCmp(value, arg, (d) => d <= 0);
      case "$in":
        return (arg as unknown[]).includes(value);
      case "$nin":
        return !(arg as unknown[]).includes(value);
      case "$exists":
        return present === arg;
      case "$regex":
        return typeof value === "string" && new RegExp(arg as string, (ops["$options"] as string | undefined) ?? "").test(value);
      case "$options":
        return true;
      case "$not":
        return !matchField(value, arg, present);
      default:
        return false; // guard đã chặn; tới đây là lỗi lập trình → không khớp gì
    }
  });
}
