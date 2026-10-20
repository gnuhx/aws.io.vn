/**
 * BẢN DỊCH THẲNG TỪ xUnit/NUnit (để so sánh — đừng dùng). Qua tsc, chạy được, nhưng:
 *  - fixture static dùng chung (= [ClassInitialize]/IClassFixture không reset) → test phụ thuộc thứ tự (Bẫy 2);
 *  - mỗi tool 1 subclass: thêm tool mới mà quên subclass → không ai báo;
 *  - "lỗi input" kiểm bằng try/catch chờ exception → callTool KHÔNG ném (Bẫy 1), nhánh catch không bao giờ chạy.
 */
import assert from "node:assert/strict";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { connectTiny, makeTiny } from "../traps/tiny-server.ts";

export abstract class ToolTestFixture {
  protected static client: Client | undefined; // [ClassInitialize] — dùng chung cho mọi test, mọi subclass

  protected static async getClient(): Promise<Client> {
    ToolTestFixture.client ??= await connectTiny(makeTiny().server);
    return ToolTestFixture.client;
  }

  abstract readonly toolName: string;
  abstract validArgs(): Record<string, unknown>;
  abstract invalidArgs(): Record<string, unknown>;

  async testOk(): Promise<void> {
    const c = await ToolTestFixture.getClient();
    const r = await c.callTool({ name: this.toolName, arguments: this.validArgs() });
    assert.notEqual(r.isError, true);
  }

  async testInvalidInput(): Promise<void> {
    const c = await ToolTestFixture.getClient();
    try {
      await c.callTool({ name: this.toolName, arguments: this.invalidArgs() });
    } catch (e) {
      assert.match(String(e), /-32602/); // không bao giờ tới đây: lỗi input về dạng isError, không ném
      return;
    }
    // quên assert.fail ở đây → test XANH dù không kiểm gì (đúng cái bẫy "pass vì không chạy assert")
  }
}

export class AddTaskTests extends ToolTestFixture {
  readonly toolName = "add_task";
  validArgs(): Record<string, unknown> {
    return { title: "Gọi lại khách" };
  }
  invalidArgs(): Record<string, unknown> {
    return { title: "ab" };
  }
}
// count_tasks: chưa có subclass — không test nào đỏ để nhắc bạn.
