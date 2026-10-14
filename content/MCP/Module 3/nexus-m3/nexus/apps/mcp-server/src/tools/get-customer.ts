import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetCustomerInputSchema, GetCustomerOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface GetCustomerDeps {
  customers: CustomerRepository;
  log: Logger;
}

/**
 * Hai loại lỗi input:
 *  - Hình thức ('abc', 'cus-7') → schema (regex) chặn, handler không chạy.
 *  - Nghiệp vụ ('cus_999' đúng dạng nhưng không có) → handler trả isError kèm hướng đi tiếp.
 */
export function registerGetCustomer(server: McpServer, deps: GetCustomerDeps): void {
  server.registerTool(
    TOOL.getCustomer,
    {
      title: "Chi tiết khách hàng",
      description:
        "Lấy đầy đủ thông tin 1 khách hàng (email, gói, ngày tạo) theo id dạng 'cus_007'. " +
        "Chưa có id thì gọi nexus_list_customers trước — đừng tự đoán id.",
      inputSchema: GetCustomerInputSchema.shape,
      outputSchema: GetCustomerOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.getCustomer, deps.log, async ({ id }) => {
      const customer = await deps.customers.get(id);
      if (!customer) {
        return toolFail({
          what: `Không có khách hàng nào với id '${id}'.`,
          next: `Gọi ${TOOL.listCustomers} (có thể lọc theo thành phố) để lấy id đúng, rồi gọi lại.`,
        });
      }
      return toolOk(GetCustomerOutputSchema, customer);
    }),
  );
}
