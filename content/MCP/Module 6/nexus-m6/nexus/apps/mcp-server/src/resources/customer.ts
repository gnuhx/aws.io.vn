import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { CustomerIdSchema, customerUri, RESOURCE } from "@nexus/shared";
import { COMPLETION_FETCH } from "../customers/repository.ts";
import type { Deps } from "../deps.ts";

export function registerCustomerResource(server: McpServer, deps: Deps): void {
  server.registerResource(
    "customer",
    new ResourceTemplate(RESOURCE.customerTemplate, {
      list: async () => {
        const r = await deps.customers.list({}, 50);
        return { resources: r.items.map((c) => ({ uri: customerUri(c.id), name: c.name, mimeType: "application/json" })) };
      },
      complete: {
        id: async (value) => (await deps.customers.search(value, {}, COMPLETION_FETCH)).map((c) => c.id),
      },
    }),
    { title: "Khách hàng", description: "1 khách theo id", mimeType: "application/json" },
    async (uri, { id }) => {
      const parsed = CustomerIdSchema.safeParse(id);
      const c = parsed.success ? await deps.customers.get(parsed.data) : undefined;
      if (!c) throw new McpError(ErrorCode.InvalidParams, `Resource not found: ${uri.href}`, { uri: uri.href });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(c) }] };
    },
  );
}
