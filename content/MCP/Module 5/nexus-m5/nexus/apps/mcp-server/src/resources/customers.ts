import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerIdSchema, RESOURCE_TEMPLATE, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { invalidResourceUri, resourceNotFound } from "./errors.ts";

const MAX_LISTED = 100;

export function registerCustomerResources(server: McpServer, deps: Deps): void {
  server.registerResource(
    "customer",
    new ResourceTemplate(RESOURCE_TEMPLATE.customer, {
      list: async () => {
        const page = await deps.customers.list({ limit: MAX_LISTED });
        return {
          resources: page.items.map((c) => ({
            uri: customerUri(c.id),
            name: c.id,
            title: c.name,
            description: c.city, // chỉ field ổn định — đổi gói không gửi list_changed
            mimeType: "application/json",
          })),
        };
      },
    }),
    { title: "Hồ sơ khách hàng", description: "Hồ sơ 1 khách theo id (JSON).", mimeType: "application/json" },
    async (uri, variables) => {
      const raw = variables.id;
      const parsed = CustomerIdSchema.safeParse(typeof raw === "string" ? raw : undefined);
      if (!parsed.success) throw invalidResourceUri(uri.href, "nexus://customers/cus_<số>");
      const c = await deps.customers.get(parsed.data);
      if (!c) throw resourceNotFound(uri.href);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(c) }] };
    },
  );
}
