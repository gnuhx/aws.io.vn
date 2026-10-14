import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCustomerInputSchema, DeleteCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export function registerDeleteCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.deleteCustomer,
    {
      title: "Xóa khách hàng",
      description:
        "Xóa vĩnh viễn 1 khách hàng. Chỉ gọi khi người dùng yêu cầu rõ ràng xóa khách cụ thể và đã xác nhận. " +
        "'deleted': false nghĩa là khách không còn tồn tại (đã xóa trước đó).",
      inputSchema: DeleteCustomerInputSchema.shape,
      outputSchema: DeleteCustomerOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteCustomer, deps.log, async ({ id }) => {
      const deleted = await deps.customers.delete(id);
      deps.log.info("customer delete", { id, deleted });
      return toolOk(DeleteCustomerOutputSchema, { id, deleted });
    }),
  );
}
