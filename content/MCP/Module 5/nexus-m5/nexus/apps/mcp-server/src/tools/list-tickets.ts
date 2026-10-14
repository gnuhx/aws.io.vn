import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListTicketsInputSchema, ListTicketsOutputSchema, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

export function registerListTickets(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.listTickets,
    {
      title: "Ticket hỗ trợ",
      description: "Liệt kê ticket trên helpdesk bên ngoài, lọc theo trạng thái và/hoặc khách. Đếm bằng total.",
      inputSchema: ListTicketsInputSchema.shape,
      outputSchema: ListTicketsOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    instrument(TOOL.listTickets, deps.log, async ({ status, customerId, limit }, extra) => {
      try {
        const r = await deps.helpdesk.listTickets({ status, customerId, limit }, extra.signal);
        return toolOk(ListTicketsOutputSchema, { total: r.total, returned: r.items.length, items: r.items });
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
