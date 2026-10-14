/** Tên tool là hợp đồng giữa server, host web và mọi client — 1 chỗ khai báo. */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  enrichCustomer: "nexus_enrich_customer",
  revenueBy: "nexus_revenue_by",
  findOrders: "nexus_find_orders",
  listTasks: "nexus_list_tasks",
  createTask: "nexus_create_task",
  updateTask: "nexus_update_task",
  deleteTask: "nexus_delete_task",
  exportTasks: "nexus_export_tasks",
} as const;

export type ToolKey = keyof typeof TOOL;
export type ToolName = (typeof TOOL)[ToolKey];
