import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import { errorFields, type Logger } from "../log.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    "list_customers",
    {
      title: "Danh sách khách hàng",
      description:
        "Liệt kê khách hàng của công ty, lọc theo thành phố. Dùng để đếm hoặc xem khách hàng. " +
        "Kết quả có 'total' (tổng thật) và 'items' (tối đa 'limit' bản ghi) — để đếm, đọc 'total'.",
      inputSchema: ListCustomersInputSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        const body = {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        };
        return { content: [{ type: "text", text: JSON.stringify(body) }] };
      } catch (err) {
        deps.log.error("list_customers failed", errorFields(err));
        return {
          isError: true,
          content: [{ type: "text", text: "Không đọc được dữ liệu khách hàng lúc này (DB không phản hồi). Thử lại sau ít phút." }],
        };
      }
    },
  );
}
