import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Deps } from "./deps.ts";
import { registerWeeklySummary } from "./prompts/weekly-summary.ts";
import { registerCharts } from "./resources/charts.ts";
import { registerCustomerResources } from "./resources/customers.ts";
import { registerDocs } from "./resources/docs.ts";
import { registerSchema } from "./resources/schema.ts";
import { enableResourceSubscriptions } from "./resources/subscriptions.ts";
import { registerAnalyzeExport } from "./tools/analyze-export.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerCreateTask } from "./tools/create-task.ts";
import { registerCreateTicket } from "./tools/create-ticket.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerDeleteTask } from "./tools/delete-task.ts";
import { registerExportCustomers } from "./tools/export-customers.ts";
import { registerFindOrders } from "./tools/find-orders.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerListExports } from "./tools/list-exports.ts";
import { registerListTasks } from "./tools/list-tasks.ts";
import { registerListTickets } from "./tools/list-tickets.ts";
import { registerPing } from "./tools/ping.ts";
import { registerQuery } from "./tools/query.ts";
import { registerReadExport } from "./tools/read-export.ts";
import { registerRevenueBy } from "./tools/revenue-by.ts";
import { registerSearchCustomers } from "./tools/search-customers.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerUpdateTask } from "./tools/update-task.ts";

const INSTRUCTIONS =
  "Nexus: dữ liệu khách hàng của công ty. Số liệu luôn lấy từ tool, không đoán. " +
  "Thuật ngữ nghiệp vụ ở resource nexus://docs/glossary.";

/** Composition root: 1 McpServer cho mỗi phiên, mọi đăng ký ở đây (trước connect). */
export function createServer(deps: Deps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: "0.5.0" },
    { instructions: INSTRUCTIONS, capabilities: { logging: {} } },
  );
  deps.log.attach(server);

  // Tools (M3 + M4)
  registerPing(server, deps);
  registerGetTime(server, deps);
  registerListCustomers(server, deps);
  registerGetCustomer(server, deps);
  registerGetExchangeRate(server, deps);
  registerChartCustomersByCity(server, deps);
  registerUpdateCustomerTier(server, deps);
  registerDeleteCustomer(server, deps);
  registerGenerateReport(server, deps);
  registerSearchCustomers(server, deps);

  // M5 · S5.1 — file trong thư mục export
  registerListExports(server, deps);
  registerReadExport(server, deps);
  registerExportCustomers(server, deps);

  // M5 · S5.2 — truy vấn chỉ đọc + schema cho LLM đọc trước
  registerQuery(server, deps);
  registerSchema(server);

  // M5 · S5.3 — helpdesk bên ngoài qua client HTTP chung
  registerListTickets(server, deps);
  registerCreateTicket(server, deps);

  // M5 · S5.4 — tổng hợp tại nguồn, không trả dữ liệu thô
  registerRevenueBy(server, deps);
  registerFindOrders(server, deps);
  registerAnalyzeExport(server, deps);

  // M5 · S5.5 — việc nội bộ: 4 tool theo workflow, cursor pagination
  registerListTasks(server, deps);
  registerCreateTask(server, deps);
  registerUpdateTask(server, deps);
  registerDeleteTask(server, deps);

  // Resources + prompt (M4)
  registerDocs(server);
  registerCustomerResources(server, deps);
  registerCharts(server, deps);
  enableResourceSubscriptions(server, deps);
  registerWeeklySummary(server);
  return server;
}
