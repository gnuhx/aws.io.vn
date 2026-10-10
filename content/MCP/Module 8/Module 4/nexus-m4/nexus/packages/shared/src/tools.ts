// Tên tool Nexus — MỘT nguồn cho server (đăng ký), host (web), test (smoke).
// Quy ước: nexus_<động từ>_<danh từ>, snake_case, ASCII (SEP-986: [A-Za-z0-9_.-], ≤ 128 ký tự).

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
  searchCustomers: "nexus_search_customers", // M4 · S4.5
} as const;

export type ToolKey = keyof typeof TOOL;
export type ToolName = (typeof TOOL)[ToolKey];
