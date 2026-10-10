import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerGetCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description: "Chi tiết 1 khách theo id (cus_xxx). Không biết id thì gọi nexus_list_customers trước.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const c = await deps.customers.get(id);
      return c ? toolOk(c) : toolFail(`Không có khách ${id}. Dùng nexus_list_customers để tìm đúng id.`);
    },
  );
}
