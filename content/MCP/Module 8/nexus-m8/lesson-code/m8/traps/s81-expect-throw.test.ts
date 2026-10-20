/** BẪY S8.1 · 1 — phản xạ xUnit `Assert.ThrowsAsync`: input sai thì callTool phải ném. Thực tế: không ném. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { connectTiny, makeTiny } from "./tiny-server.ts";

test("title quá ngắn → callTool ném lỗi?", async () => {
  const client = await connectTiny(makeTiny().server);
  await assert.rejects(client.callTool({ name: "add_task", arguments: { title: "ab" } }));
  await client.close();
});
