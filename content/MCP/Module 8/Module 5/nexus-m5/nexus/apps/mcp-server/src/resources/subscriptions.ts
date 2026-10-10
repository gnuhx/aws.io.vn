import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SubscribeRequestSchema, UnsubscribeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { RESOURCE, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resourceNotFound } from "./errors.ts";

/**
 * M4 · S4.3: McpServer v1 không xử lý resources/subscribe — tự khai capability + 2 handler.
 * Tập subscription nằm trong closure của 1 McpServer (1 phiên), không phải biến module.
 */
export function enableResourceSubscriptions(server: McpServer, deps: Deps): void {
  const subscribed = new Set<string>();
  server.server.registerCapabilities({ resources: { subscribe: true, listChanged: true } });

  server.server.setRequestHandler(SubscribeRequestSchema, async (req) => {
    const { uri } = req.params;
    const known = uri === RESOURCE.glossary || uri === RESOURCE.chartByCity || (await exists(uri));
    if (!known) throw resourceNotFound(uri);
    subscribed.add(uri);
    return {};
  });
  server.server.setRequestHandler(UnsubscribeRequestSchema, async (req) => {
    subscribed.delete(req.params.uri);
    return {};
  });

  async function exists(uri: string): Promise<boolean> {
    const m = /^nexus:\/\/customers\/(cus_\d{3,})$/.exec(uri);
    if (!m?.[1]) return false;
    const page = await deps.customers.list({ limit: 100_000 });
    return page.items.some((c) => c.id === m[1]);
  }

  const notify = (uri: string): void => {
    if (subscribed.has(uri)) void server.server.sendResourceUpdated({ uri }).catch(() => undefined);
  };

  const unwatch = deps.customers.watch((change) => {
    switch (change.kind) {
      case "updated":
        notify(customerUri(change.id));
        return;
      case "created":
      case "deleted":
        server.sendResourceListChanged();
        notify(RESOURCE.chartByCity);
        notify(customerUri(change.id));
        return;
    }
  });
  const prev = server.server.onclose;
  server.server.onclose = () => {
    unwatch();
    prev?.();
  };
}
