import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Deps } from "./deps.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";
import { registerSearchCustomers } from "./tools/search-customers.ts";
import { registerDocs } from "./resources/docs.ts";
import { registerCustomerResources } from "./resources/customers.ts";
import { registerChartResources } from "./resources/charts.ts";
import { enableResourceSubscriptions } from "./resources/subscriptions.ts";
import { registerWeeklySummary } from "./prompts/weekly-summary.ts";

export type { Deps } from "./deps.ts";

const INSTRUCTIONS =
  "Server dữ liệu nội bộ của Nexus: khách hàng, tỷ giá, báo cáo. " +
  "Mọi tool có prefix nexus_. Thuật ngữ nghiệp vụ ở resource nexus://docs/glossary; " +
  "hồ sơ khách ở nexus://customers/{id}. Không đoán số liệu khi tool trả lỗi — báo người dùng.";

/** Composition root của MCP server: không biết transport (stdio hay HTTP ở M7). */
export function createServer(deps: Deps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: "0.4.0" },
    { instructions: INSTRUCTIONS, capabilities: { logging: {} } },
  );
  // Tools — model chọn gọi
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
  // Resources — ứng dụng chọn đưa vào context (M4)
  registerDocs(server);
  registerCustomerResources(server, deps);
  registerChartResources(server, deps);
  enableResourceSubscriptions(server, deps);
  // Prompts — người dùng chọn (M4)
  registerWeeklySummary(server);
  return server;
}
