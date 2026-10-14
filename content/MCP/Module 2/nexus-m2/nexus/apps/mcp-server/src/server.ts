import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CustomerRepository } from "./customers/repository.ts";
import type { Logger } from "./log.ts";
import { registerGetTime } from "./tools/get-time.ts";
import { registerListCustomers } from "./tools/list-customers.ts";
import { registerPing } from "./tools/ping.ts";

export interface ServerDeps {
  customers: CustomerRepository;
  log: Logger;
  now: () => Date;
}

/** Composition root: lắp tool vào server. Không biết transport — stdio hay HTTP là việc của entry point. */
export function createNexusServer(deps: ServerDeps): McpServer {
  const server = new McpServer({ name: "nexus", version: "0.1.0" });
  registerPing(server);
  registerGetTime(server, deps);
  registerListCustomers(server, deps);
  return server;
}
