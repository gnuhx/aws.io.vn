import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateCustomerTierInputSchema, UpdateCustomerTierOutputSchema } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface UpdateTierDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerUpdateCustomerTier(server: McpServer, deps: UpdateTierDeps): void {
  server.registerTool(
    TOOL.updateCustomerTier,
    {
      title: "Đổi gói khách hàng",
      description:
        "Đổi gói dịch vụ (free/pro/enterprise) của 1 khách hàng — GHI dữ liệu, ghi đè gói cũ. " +
        "Chỉ gọi khi người dùng yêu cầu rõ ràng việc đổi gói cho đúng khách đó.",
      inputSchema: UpdateCustomerTierInputSchema.shape,
      outputSchema: UpdateCustomerTierOutputSchema.shape,
      // Ghi đè giá trị cũ (không khôi phục được nếu không nhớ gói cũ) → destructive. Đặt lại cùng gói → idempotent.
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateCustomerTier, deps.log, async ({ id, tier }) => {
      const change = await deps.customers.updateTier(id, tier);
      if (!change) {
        return toolFail({ what: `Không có khách hàng nào với id '${id}', chưa đổi gì.`, next: `Gọi ${TOOL.listCustomers} để lấy id đúng.` });
      }
      deps.log.info("customer tier set", { id, from: change.previousTier, to: change.tier, changed: change.changed });
      return toolOk(UpdateCustomerTierOutputSchema, { id, ...change });
    }),
  );
}
