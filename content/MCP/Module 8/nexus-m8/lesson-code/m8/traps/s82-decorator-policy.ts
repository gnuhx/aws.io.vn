/**
 * BẪY S8.2 · phản xạ C# `[RequiresConfirmation]` attribute → decorator TS.
 * tsc chấp nhận (decorator chuẩn TC39, không bị erasableSyntaxOnly chặn) — nhưng Node 22 chạy .ts bằng type stripping
 * KHÔNG hỗ trợ decorator: SyntaxError lúc nạp module. Policy phải là dữ liệu/hàm, không phải attribute.
 *   node traps/s82-decorator-policy.ts
 */
const needsConfirm = new Set<string>();

function RequiresConfirmation(_target: unknown, ctx: ClassMethodDecoratorContext): void {
  needsConfirm.add(String(ctx.name));
}

class DeleteTaskTool {
  @RequiresConfirmation
  async run(id: string): Promise<string> {
    return `đã xóa ${id}`;
  }
}

console.log([...needsConfirm], await new DeleteTaskTool().run("task_0001"));
