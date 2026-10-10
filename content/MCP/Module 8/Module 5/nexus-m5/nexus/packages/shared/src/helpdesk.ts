import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TICKET_STATUSES = ["open", "pending", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "normal", "high"] as const;

export const TicketSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  createdAt: z.string(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const ListTicketsInputSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional().describe("open | pending | closed"),
  customerId: CustomerIdSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export const ListTicketsOutputSchema = z.object({
  total: z.number().int(),
  returned: z.number().int(),
  items: z.array(TicketSchema),
});

export const CreateTicketInputSchema = z.object({
  customerId: CustomerIdSchema,
  subject: z.string().trim().min(5).max(120),
  body: z.string().trim().min(1).max(2_000),
  priority: z.enum(TICKET_PRIORITIES).default("normal"),
});
export const CreateTicketOutputSchema = z.object({
  ticket: TicketSchema,
  created: z.boolean().describe("false = yêu cầu trùng, trả lại ticket đã tạo trước đó (không tạo bản 2)"),
});
