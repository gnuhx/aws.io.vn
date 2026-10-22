/**
 * BẢN DỊCH THẲNG TỪ C# (để so sánh — đừng dùng): policy kiểu ASP.NET `IAuthorizationHandler` + registry tĩnh.
 * Qua tsc. Ba lỗi thiết kế:
 *  - chỉ hỏi người dùng khi tool có destructiveHint → nexus_update_task (đánh dấu done hàng loạt) lọt qua (S8.2 kịch bản B);
 *  - registry tĩnh theo TÊN tool: server đổi định nghĩa / thêm tool mới → mặc định "không cần hỏi" (fail-open);
 *  - class + kế thừa cho 1 câu hỏi có/không.
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface IToolPolicy {
  requiresConfirmation(tool: Tool): boolean;
}

export abstract class ToolPolicyBase implements IToolPolicy {
  protected static readonly registry = new Map<string, boolean>([["nexus_delete_task", true]]);
  abstract requiresConfirmation(tool: Tool): boolean;
}

export class DestructiveOnlyPolicy extends ToolPolicyBase {
  requiresConfirmation(tool: Tool): boolean {
    return ToolPolicyBase.registry.get(tool.name) ?? tool.annotations?.destructiveHint === true; // không biết → false
  }
}

export class ToolPolicyEvaluator {
  private readonly policies: IToolPolicy[];
  constructor(policies: IToolPolicy[]) {
    this.policies = policies;
  }
  mustAsk(tool: Tool): boolean {
    return this.policies.some((p) => p.requiresConfirmation(tool));
  }
}
