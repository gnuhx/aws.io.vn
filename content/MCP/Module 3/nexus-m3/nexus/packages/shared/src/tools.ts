/**
 * Tên tool của Nexus — 1 nguồn duy nhất cho server, web (host) và test.
 * Quy ước: <prefix>_<động từ>_<danh từ>, snake_case, chỉ [a-z0-9_] (SEP-986 cho phép thêm '.', '-').
 */
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
} as const;

export type ToolName = (typeof TOOL)[keyof typeof TOOL];
