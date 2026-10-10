import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Deps } from "./deps.ts";
import { registerCustomerBrief } from "./prompts/customer-brief.ts";
import { registerWeeklySummary } from "./prompts/weekly-summary.ts";
import { registerCustomerResource } from "./resources/customer.ts";
import { registerGlossary } from "./resources/glossary.ts";
import { registerCreateTask } from "./tools/create-task.ts";
import { registerDeleteTask } from "./tools/delete-task.ts";
import { registerEnrichCustomer } from "./tools/enrich-customer.ts";
import { registerExportTasks } from "./tools/export-tasks.ts";
import { trackRoots } from "./roots/workspace.ts";
import { registerFindOrders } from "./tools/find-orders.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerListTasks } from "./tools/list-tasks.ts";
import { registerPing } from "./tools/ping.ts";
import { registerRevenueBy } from "./tools/revenue-by.ts";
import { registerUpdateTask } from "./tools/update-task.ts";

export const SERVER_INFO = { name: "nexus", title: "Nexus", version: "0.6.0" } as const;

export const INSTRUCTIONS =
  "Nexus: dữ liệu khách hàng, đơn hàng và việc nội bộ của công ty. " +
  "Số liệu tổng hợp: dùng nexus_revenue_by / nexus_find_orders, đừng tự cộng. Danh sách việc dài: theo nextCursor.";

/** 1 server = 1 phiên client. Đăng ký mọi thứ ở đây — composition root của MCP. */
export function createServer(deps: Deps): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS, capabilities: { logging: {} } });
  registerPing(server, deps);
  registerGetTime(server, deps);
  registerListCustomers(server, deps);
  registerGetCustomer(server, deps);
  registerEnrichCustomer(server, deps);
  registerRevenueBy(server, deps);
  registerFindOrders(server, deps);
  registerListTasks(server, deps);
  registerCreateTask(server, deps);
  registerUpdateTask(server, deps);
  registerDeleteTask(server, deps);
  registerExportTasks(server, deps, trackRoots(server.server, deps.log)); // roots: theo dõi riêng từng phiên
  registerGlossary(server);
  registerCustomerResource(server, deps);
  registerWeeklySummary(server);
  registerCustomerBrief(server, deps);
  return server;
}
