import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateCustomerTierInputSchema, UpdateCustomerTierOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateCustomerTier(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateCustomerTier,
    {
      title: "Đổi gói khách hàng",
      description:
        "Đổi gói dịch vụ (free/pro/enterprise) của 1 khách. Chỉ gọi khi người dùng yêu cầu rõ ràng đổi gói cho khách cụ thể. " +
        "Gọi lại với cùng gói không đổi gì ('changed': false).",
      inputSchema: UpdateCustomerTierInputSchema.shape,
      outputSchema: UpdateCustomerTierOutputSchema.shape,
      // ghi đè gói cũ → destructive; đặt lại cùng gói không thêm hiệu ứng → idempotent
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateCustomerTier, deps.log, async ({ id, tier }) => {
      const r = await deps.customers.updateTier(id, tier);
      if (!r) {
        return toolFail({ what: `Không có khách hàng nào với id '${id}'.`, next: `Gọi ${TOOL.listCustomers} để lấy id đúng, rồi gọi lại.` });
      }
      deps.log.info("customer tier set", { id, tier, changed: r.changed });
      return toolOk(UpdateCustomerTierOutputSchema, { id, tier, previousTier: r.previousTier, changed: r.changed });
    }),
  );
}
