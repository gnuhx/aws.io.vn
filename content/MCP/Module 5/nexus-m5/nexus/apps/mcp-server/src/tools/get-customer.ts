import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerGetCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Hồ sơ 1 khách hàng",
      description: "Hồ sơ đầy đủ của 1 khách theo id (dạng cus_007). Chưa có id thì gọi nexus_search_customers hoặc nexus_list_customers trước.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const c = await deps.customers.get(id);
      if (!c) return toolFail({ what: `Không có khách hàng ${id}.`, next: "Gọi nexus_list_customers hoặc nexus_search_customers để lấy id đúng." });
      return toolOk(GetCustomerOutputSchema, c);
    }),
  );
}
