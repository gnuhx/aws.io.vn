/** BẪY S8.1 · 3 — đặt tên kiểu Jest/Vitest (*.spec.ts). `node --test` không tìm thấy file này. */
import assert from "node:assert/strict";
import { test } from "node:test";

test("luôn đỏ — nếu được chạy", () => {
  assert.fail("test này lẽ ra phải chạy và đỏ");
});
