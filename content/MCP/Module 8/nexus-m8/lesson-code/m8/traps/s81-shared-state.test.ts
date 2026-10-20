/** BẪY S8.1 · 2 — 1 server cho cả file (kiểu `[ClassInitialize]` / IClassFixture không reset): test phụ thuộc thứ tự. */
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { connectTiny, makeTiny } from "./tiny-server.ts";

const client = await connectTiny(makeTiny().server); // dùng chung cho mọi test bên dưới
after(() => client.close());

test("tạo việc mới", async () => {
  const r = await client.callTool({ name: "add_task", arguments: { title: "Gọi lại khách" } });
  assert.equal(r.isError, undefined);
});

test("đếm việc: seed có 2 việc", async () => {
  const r = await client.callTool({ name: "count_tasks" });
  assert.deepEqual(r.structuredContent, { count: 2 });
});
