import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerIdSchema, RESOURCE_TEMPLATE, TOOL, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { invalidResourceUri, resourceNotFound } from "./errors.ts";

/** Trần số khách đưa vào resources/list. Tập lớn hơn: tìm bằng tool + resource_link (S4.5). */
export const MAX_LISTED = 100;

export function registerCustomerResources(server: McpServer, deps: Deps): void {
  const template = new ResourceTemplate(RESOURCE_TEMPLATE.customer, {
    // list: bắt buộc khai (kể cả undefined) — SDK ép bạn nghĩ xem tập này có liệt kê được không.
    list: async () => {
      const page = await deps.customers.list({ limit: MAX_LISTED });
      return {
        resources: page.items.map((c) => ({
          uri: customerUri(c.id),
          name: c.id,
          title: c.name,
          // Chỉ để field ổn định trong metadata: đổi gói KHÔNG gửi list_changed, nên đừng đưa gói vào đây
          description: c.city,
          mimeType: "application/json",
        })),
      };
    },
  });

  server.registerResource(
    "customer",
    template,
    {
      title: "Hồ sơ khách hàng",
      description: `Hồ sơ đầy đủ của 1 khách (JSON). Id dạng 'cus_007'. Tìm id bằng tool ${TOOL.searchCustomers} hoặc ${TOOL.listCustomers}.`,
      mimeType: "application/json",
    },
    async (uri, variables) => {
      // variables.id: string | string[] — URI template có thể tách mảng
      const raw = Array.isArray(variables.id) ? variables.id.join(",") : variables.id;
      const id = CustomerIdSchema.safeParse(raw);
      if (!id.success) throw invalidResourceUri(uri.href, "nexus://customers/cus_<số>, ví dụ nexus://customers/cus_007");
      const customer = await deps.customers.get(id.data);
      if (!customer) {
        throw resourceNotFound(uri.href, `Không có khách '${id.data}'. Tìm id đúng bằng ${TOOL.searchCustomers}.`);
      }
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(customer) }] };
    },
  );
}
