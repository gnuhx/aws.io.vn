import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ResourceLink } from "@modelcontextprotocol/sdk/types.js";
import { SearchCustomersInputSchema, SearchCustomersOutputSchema, TOOL, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOkLinks } from "../tool-result.ts";

export function registerSearchCustomers(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.searchCustomers,
    {
      title: "Tìm khách hàng",
      description:
        "Tìm khách theo một phần tên hoặc email (không phân biệt dấu). Trả tham chiếu resource_link nexus://customers/{id}, không trả hồ sơ. " +
        "Cần chi tiết 1 khách: gọi nexus_get_customer với id.",
      inputSchema: SearchCustomersInputSchema.shape,
      outputSchema: SearchCustomersOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.searchCustomers, deps.log, async ({ query, limit }) => {
      const page = await deps.customers.search({ query, limit });
      if (page.total === 0) return toolFail({ what: `Không có khách nào khớp "${query}".`, next: "Thử ít ký tự hơn, hoặc dùng nexus_list_customers theo thành phố." });
      const items = page.items.map((c) => ({ id: c.id, name: c.name, uri: customerUri(c.id) }));
      const links: ResourceLink[] = items.map((c) => ({ type: "resource_link", uri: c.uri, name: c.id, title: c.name, mimeType: "application/json" }));
      const rest = page.total - items.length;
      const summary =
        `Tìm thấy ${page.total} khách khớp '${query}', trả ${items.length} tham chiếu.` +
        (rest > 0 ? ` Còn ${rest} kết quả nữa — thu hẹp query hoặc thêm city.` : "");
      return toolOkLinks(SearchCustomersOutputSchema, { query, total: page.total, returned: items.length, items }, summary, links);
    }),
  );
}
