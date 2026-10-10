import { TICKET_PRIORITIES, TICKET_STATUSES, type Ticket } from "@nexus/shared";
import { z } from "zod";
import type { ApiClient } from "../http/api-client.ts";
import type { HelpdeskPort } from "./port.ts";

/** Hình dạng của VENDOR (snake_case) — chỉ sống trong file này (anti-corruption layer). */
const VendorTicket = z.object({
  id: z.string(),
  customer_id: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  created_at: z.string(),
});
const VendorList = z.object({ data: z.array(VendorTicket), total: z.number().int() });
const VendorCreated = z.object({ ticket: VendorTicket, replayed: z.boolean() });

const toTicket = (t: z.infer<typeof VendorTicket>): Ticket => ({
  id: t.id,
  customerId: t.customer_id,
  subject: t.subject,
  status: t.status,
  priority: t.priority,
  createdAt: t.created_at,
});

export function createHttpHelpdesk(api: ApiClient): HelpdeskPort {
  return {
    async listTickets({ status, customerId, limit }, signal) {
      const r = await api.get("/v1/tickets", {
        schema: VendorList,
        query: { status, customer: customerId, limit },
        ...(signal ? { signal } : {}),
      });
      return { total: r.total, items: r.data.map(toTicket) };
    },
    async createTicket(input, idempotencyKey, signal) {
      const r = await api.post("/v1/tickets", {
        schema: VendorCreated,
        body: { customer_id: input.customerId, subject: input.subject, body: input.body, priority: input.priority },
        idempotencyKey,
        ...(signal ? { signal } : {}),
      });
      return { ticket: toTicket(r.ticket), created: !r.replayed };
    },
  };
}
