import type { Ticket } from "@nexus/shared";

/**
 * Cổng tới hệ thống helpdesk (M5 · S5.3). Tool chỉ biết cổng này — đổi nhà cung cấp là viết adapter mới,
 * không sửa tool. Kiểu dữ liệu là của Nexus (camelCase), không phải của vendor.
 */
export interface HelpdeskPort {
  listTickets(q: { status?: Ticket["status"] | undefined; customerId?: string | undefined; limit: number }, signal?: AbortSignal): Promise<{ total: number; items: Ticket[] }>;
  createTicket(
    input: { customerId: string; subject: string; body: string; priority: Ticket["priority"] },
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<{ ticket: Ticket; created: boolean }>;
}
