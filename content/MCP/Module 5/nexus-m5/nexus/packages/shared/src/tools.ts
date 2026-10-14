/** Tên tool là hợp đồng giữa server, host web và LLM: 1 nguồn duy nhất (M3 · S3.1). */
export const TOOL = {
  ping: "nexus_ping",
  getTime: "nexus_get_time",
  listCustomers: "nexus_list_customers",
  getCustomer: "nexus_get_customer",
  getExchangeRate: "nexus_get_exchange_rate",
  chartCustomersByCity: "nexus_chart_customers_by_city",
  updateCustomerTier: "nexus_update_customer_tier",
  deleteCustomer: "nexus_delete_customer",
  generateReport: "nexus_generate_report",
  searchCustomers: "nexus_search_customers",
  // M5 · S5.1 — file trong thư mục export
  listExports: "nexus_list_exports",
  readExport: "nexus_read_export",
  exportCustomers: "nexus_export_customers",
  // M5 · S5.2 — truy vấn chỉ đọc
  query: "nexus_query",
  // M5 · S5.3 — bọc API helpdesk bên ngoài
  listTickets: "nexus_list_tickets",
  createTicket: "nexus_create_ticket",
  // M5 · S5.4 — tổng hợp thay vì dữ liệu thô
  revenueBy: "nexus_revenue_by",
  findOrders: "nexus_find_orders",
  analyzeExport: "nexus_analyze_export",
  // M5 · S5.5 — việc nội bộ: CRUD theo workflow + cursor
  listTasks: "nexus_list_tasks",
  createTask: "nexus_create_task",
  updateTask: "nexus_update_task",
  deleteTask: "nexus_delete_task",
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
