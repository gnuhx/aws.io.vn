import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SubscribeRequestSchema, UnsubscribeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { RESOURCE, customerUri } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { resourceNotFound } from "./errors.ts";

const CUSTOMER_URI_RE = /^nexus:\/\/customers\/[^/]+$/;
const isKnownUri = (uri: string): boolean => Object.values<string>(RESOURCE).includes(uri) || CUSTOMER_URI_RE.test(uri);

/**
 * resources/subscribe + resources/unsubscribe, và nối thay đổi dữ liệu → thông báo MCP.
 * Tập subscription sống trong closure của 1 McpServer = 1 phiên client (M7: mỗi phiên HTTP 1 server riêng),
 * KHÔNG để ở biến toàn cục của module.
 * Gọi TRƯỚC server.connect(): capability phải có trong kết quả initialize.
 */
export function enableResourceSubscriptions(server: McpServer, deps: Deps): () => void {
  const subscribed = new Set<string>();
  server.server.registerCapabilities({ resources: { subscribe: true, listChanged: true } });

  server.server.setRequestHandler(SubscribeRequestSchema, async (req) => {
    const { uri } = req.params;
    if (!isKnownUri(uri)) throw resourceNotFound(uri, "Chỉ subscribe được URI có trong resources/list hoặc khớp nexus://customers/{id}.");
    subscribed.add(uri);
    deps.log.debug("resource subscribed", { uri, total: subscribed.size });
    return {};
  });
  server.server.setRequestHandler(UnsubscribeRequestSchema, async (req) => {
    subscribed.delete(req.params.uri);
    deps.log.debug("resource unsubscribed", { uri: req.params.uri, total: subscribed.size });
    return {};
  });

  const notifyUpdated = (uri: string): void => {
    if (!subscribed.has(uri)) return; // không ai nghe → im lặng
    void server.server.sendResourceUpdated({ uri }).catch(() => undefined);
  };

  const unwatch = deps.customers.watch((change) => {
    if (change.kind === "updated") {
      notifyUpdated(customerUri(change.id)); // nội dung đổi, danh sách không đổi
      return; // đổi gói không đổi số khách theo thành phố → biểu đồ KHÔNG đổi
    }
    // created / deleted: DANH SÁCH đổi, và số khách theo thành phố (nội dung biểu đồ) đổi
    server.sendResourceListChanged();
    notifyUpdated(RESOURCE.customersByCityChart);
    if (change.kind === "deleted") {
      notifyUpdated(customerUri(change.id)); // người đang theo dõi đọc lại sẽ nhận "Resource not found"
      subscribed.delete(customerUri(change.id));
    }
  });

  const prevClose = server.server.onclose;
  server.server.onclose = () => {
    unwatch(); // không rò listener khi phiên đóng
    prevClose?.();
  };
  return unwatch;
}
