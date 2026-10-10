import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeleteCustomerInputSchema, DeleteCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";

export interface DeleteCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerDeleteCustomer(server: McpServer, deps: DeleteCustomerDeps): void {
  server.registerTool(
    TOOL.deleteCustomer,
    {
      title: "Xóa khách hàng",
      description:
        "XÓA VĨNH VIỄN 1 khách hàng theo id. Không hoàn tác được. " +
        "Chỉ gọi khi người dùng yêu cầu xóa đúng khách đó và đã xác nhận; không bao giờ gọi để 'dọn dẹp' tự phát.",
      inputSchema: DeleteCustomerInputSchema.shape,
      outputSchema: DeleteCustomerOutputSchema.shape,
      // Xóa 2 lần = xóa 1 lần (lần 2 deleted=false) → idempotent, nhưng vẫn destructive.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.deleteCustomer, deps.log, async ({ id }) => {
      const deleted = await deps.customers.delete(id);
      deps.log.warn("customer delete", { id, deleted });
      return toolOk(DeleteCustomerOutputSchema, { id, deleted });
    }),
  );
}
