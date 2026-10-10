import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCustomerInputSchema, DeleteCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerDeleteCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteCustomer,
    {
      title: "Xóa khách hàng",
      description: "Xóa vĩnh viễn 1 khách. Không hoàn tác được. Chỉ gọi khi người dùng xác nhận rõ id cần xóa.",
      inputSchema: DeleteCustomerInputSchema.shape,
      outputSchema: DeleteCustomerOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteCustomer, deps.log, async ({ id }) => {
      const deleted = await deps.customers.delete(id);
      if (!deleted) return toolFail({ what: `Không có khách hàng ${id} để xóa.`, next: "Kiểm tra id bằng nexus_search_customers." });
      return toolOk(DeleteCustomerOutputSchema, { id, deleted });
    }),
  );
}
