import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerGetCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng theo id (dạng 'cus_007'). Gọi khi đã có id cụ thể. " +
        "Chưa có id thì gọi nexus_list_customers trước.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      // id: CustomerId — lỗi định dạng đã bị schema chặn, tới đây chỉ còn lỗi nghiệp vụ
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo city) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
