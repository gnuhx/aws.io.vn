import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

/**
 * S7.5 — Cache hint `ttlMs` + `cacheScope` (SEP-2549, chốt trong spec 2026-07-28).
 * SDK v1 1.30.1 chưa biết 2 field này → gắn thêm ở MÉP transport, không đụng code tool.
 * Đây là phần "spec mới" duy nhất của server: xóa file này + 1 dòng gọi là gỡ sạch.
 */
export type CachePolicy = {
  /** Danh sách tool/prompt/template: đổi khi deploy. */
  listTtlMs: number;
  /** resources/read: dữ liệu, đổi thường xuyên. */
  readTtlMs: number;
  /** true khi kết quả list khác nhau theo token (S7.4 lọc tool theo scope) → "private". */
  perUserLists: boolean;
};

type Kind = "list" | "read";
const LIST_KEYS = ["tools", "prompts", "resources", "resourceTemplates"] as const;

function kindOf(result: Record<string, unknown>): Kind | null {
  if (LIST_KEYS.some((k) => Array.isArray(result[k]))) return "list";
  if (Array.isArray(result["contents"])) return "read";
  return null;
}

/** Hàm thuần: message vào → message ra (có hint nếu là kết quả cache được). */
export function withHints(msg: JSONRPCMessage, p: CachePolicy): JSONRPCMessage {
  if (!("result" in msg)) return msg;
  const kind = kindOf(msg.result);
  if (!kind) return msg;
  const hints =
    kind === "list"
      ? { ttlMs: p.listTtlMs, cacheScope: p.perUserLists ? "private" : "public" }
      : { ttlMs: p.readTtlMs, cacheScope: "private" }; // dữ liệu của người dùng: không bao giờ public
  return { ...msg, result: { ...msg.result, ...hints } };
}

/** Bọc send() của transport. Gọi TRƯỚC server.connect(transport). */
export function attachCacheHints<T extends Transport>(transport: T, p: CachePolicy): T {
  const send = transport.send.bind(transport);
  transport.send = (msg, opts) => send(withHints(msg, p), opts);
  return transport;
}
