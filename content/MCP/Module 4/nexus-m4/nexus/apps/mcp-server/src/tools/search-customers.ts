import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE_TEMPLATE, SearchCustomersInputSchema, SearchCustomersOutputSchema, TOOL, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOkLinks } from "../tool-result.ts";

export function registerSearchCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.searchCustomers,
    {
      title: "Tìm khách hàng",
      description:
        "Tìm khách theo tên hoặc email (không phân biệt dấu), trả DANH SÁCH THAM CHIẾU (resource_link) chứ không trả hồ sơ. " +
        `Gọi khi người dùng nhắc tên/email khách mà chưa có id. Cần chi tiết 1 khách: đọc resource ${RESOURCE_TEMPLATE.customer} ` +
        `hoặc gọi ${TOOL.getCustomer}. Để đếm, đọc 'total'.`,
      inputSchema: SearchCustomersInputSchema.shape,
      outputSchema: SearchCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    instrument(TOOL.searchCustomers, deps.log, async ({ query, city, limit }) => {
      const page = await deps.customers.search({ query, city, limit });
      if (page.total === 0) {
        return toolFail({
          what: `Không có khách nào khớp '${query}'${city ? ` ở ${city}` : ""}.`,
          next: `Thử từ khóa ngắn hơn (một phần tên), bỏ bộ lọc city, hoặc gọi ${TOOL.listCustomers}.`,
        });
      }
      const items = page.items.map((c) => ({ id: c.id, name: c.name, uri: customerUri(c.id) }));
      const more = page.total > items.length ? ` Còn ${page.total - items.length} kết quả nữa — thu hẹp query hoặc thêm city.` : "";
      return toolOkLinks(
        SearchCustomersOutputSchema,
        { query, total: page.total, returned: items.length, items },
        `Tìm thấy ${page.total} khách khớp '${query}', trả ${items.length} tham chiếu.${more}`,
        // Link tối giản: uri + name (id) + title (tên hiển thị). mimeType đã có ở template, không lặp 100 lần.
        page.items.map((c) => ({ uri: customerUri(c.id), name: c.id, title: c.name })),
      );
    }),
  );
}
