import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import type { RatesClient } from "./rates/client.ts";
import { registerPing } from "./tools/ping.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerGetCustomer } from "./tools/get-customer.ts";
import { registerGetExchangeRate } from "./tools/get-exchange-rate.ts";
import { registerChartCustomersByCity } from "./tools/chart-customers-by-city.ts";
import { registerUpdateCustomerTier } from "./tools/update-customer-tier.ts";
import { registerDeleteCustomer } from "./tools/delete-customer.ts";
import { registerGenerateReport } from "./tools/generate-report.ts";

export const SERVER_VERSION = "0.3.0";

export interface ServerDeps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
  reportStepMs?: number;
}

/** Composition root: đọc là biết server có tool gì. */
export function createServer(deps: ServerDeps): McpServer {
  const server = new McpServer(
    { name: "nexus", version: SERVER_VERSION },
    {
      // logging: bật logging/setLevel + notifications/message. Thiếu dòng này, log gửi client bị bỏ qua im lặng.
      capabilities: { logging: {} },
      instructions:
        "Nexus: dữ liệu khách hàng của công ty. Mọi tool có tiền tố nexus_. " +
        "Đếm/lọc dùng nexus_list_customers (đọc 'total'); chi tiết 1 khách dùng nexus_get_customer với id lấy từ danh sách.",
    },
  );
  const { customers, log, now } = deps;
  registerPing(server, { version: SERVER_VERSION });
  registerGetTime(server, { now, log });
  registerListCustomers(server, { customers, log });
  registerGetCustomer(server, { customers, log });
  registerGetExchangeRate(server, { rates: deps.rates, log });
  registerChartCustomersByCity(server, { customers, log });
  registerUpdateCustomerTier(server, { customers, log });
  registerDeleteCustomer(server, { customers, log });
  registerGenerateReport(server, { customers, log, now, stepMs: deps.reportStepMs ?? 400 });
  return server;
}
