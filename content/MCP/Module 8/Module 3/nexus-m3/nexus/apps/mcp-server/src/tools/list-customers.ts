import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListCustomersInputSchema, ListCustomersOutputSchema, TOOL } from "@nexus/shared";
import type { CustomerRepository } from "../customers/repository.ts";
import type { Logger } from "../log.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export interface ListCustomersDeps {
  customers: CustomerRepository;
  log: Logger;
}

export function registerListCustomers(server: McpServer, deps: ListCustomersDeps): void {
  server.registerTool(
    TOOL.listCustomers,
    {
      title: "Danh sách khách hàng",
      description:
        "Đếm hoặc liệt kê khách hàng, lọc theo thành phố. Gọi khi người dùng hỏi 'có bao nhiêu khách', " +
        "'khách nào ở X', hoặc cần id để gọi nexus_get_customer. Để đếm, đọc 'total' — 'items' bị cắt theo 'limit'.",
      inputSchema: ListCustomersInputSchema.shape,
      outputSchema: ListCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.listCustomers, deps.log, async ({ city, limit }) => {
      try {
        const page = await deps.customers.list({ city, limit });
        return toolOk(ListCustomersOutputSchema, {
          total: page.total,
          returned: page.items.length,
          items: page.items.map(({ id, name, city: c, tier }) => ({ id, name, city: c, tier })),
        });
      } catch (err) {
        deps.log.error("list customers: db error", { err: String(err) });
        return toolFail({ what: "Không đọc được dữ liệu khách hàng (cơ sở dữ liệu không phản hồi).", next: "Thử lại sau ít phút; đừng đoán số liệu." });
      }
    }),
  );
}
