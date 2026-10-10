import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOL, UpdateTierInputSchema, UpdateTierOutputSchema } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerUpdateCustomerTier(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.updateCustomerTier,
    {
      title: "Đổi gói khách hàng",
      description: "Đổi gói dịch vụ (free | pro | enterprise) của 1 khách. Chỉ gọi khi người dùng yêu cầu rõ ràng.",
      inputSchema: UpdateTierInputSchema.shape,
      outputSchema: UpdateTierOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.updateCustomerTier, deps.log, async ({ id, tier }) => {
      const r = await deps.customers.updateTier(id, tier);
      if (!r) return toolFail({ what: `Không có khách hàng ${id}.`, next: "Kiểm tra id bằng nexus_search_customers." });
      return toolOk(UpdateTierOutputSchema, { id, previousTier: r.previousTier, tier, changed: r.changed });
    }),
  );
}
