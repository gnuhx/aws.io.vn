import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTicketInputSchema, CreateTicketOutputSchema, TOOL } from "@nexus/shared";
import { createHash } from "node:crypto";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { toolFail, toolOk } from "../tool-result.ts";
import { helpdeskFailure } from "./helpdesk-errors.ts";

/** Cùng nội dung → cùng key: model gọi lại (hoặc client retry) không tạo ticket thứ 2. */
const idemKey = (customerId: string, subject: string, body: string): string =>
  createHash("sha256").update(`${customerId}\n${subject}\n${body}`).digest("hex").slice(0, 32);

export function registerCreateTicket(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.createTicket,
    {
      title: "Tạo ticket hỗ trợ",
      description:
        "Tạo 1 ticket trên helpdesk cho 1 khách. Gọi khi người dùng yêu cầu ghi nhận sự cố/yêu cầu hỗ trợ. " +
        "Gọi lại với cùng nội dung không tạo bản trùng (created=false).",
      inputSchema: CreateTicketInputSchema.shape,
      outputSchema: CreateTicketOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    instrument(TOOL.createTicket, deps.log, async ({ customerId, subject, body, priority }, extra) => {
      if (!(await deps.customers.get(customerId))) {
        return toolFail({ what: `Không có khách hàng ${customerId}.`, next: "Lấy id đúng bằng nexus_search_customers trước khi tạo ticket." });
      }
      try {
        const r = await deps.helpdesk.createTicket({ customerId, subject, body, priority }, idemKey(customerId, subject, body), extra.signal);
        return toolOk(CreateTicketOutputSchema, r);
      } catch (err) {
        return helpdeskFailure(err);
      }
    }),
  );
}
