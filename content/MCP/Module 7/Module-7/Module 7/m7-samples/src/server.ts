import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TaskSchema, type TaskStore } from "./store.ts";

/** Mọi thứ 1 server cần biết về nơi nó chạy — transport KHÔNG nằm trong này (S7.1). */
export type ServerCtx = {
  store: TaskStore;
  /** Tên instance (S7.2: thấy request rơi vào máy nào). */
  instance: string;
  /** Scope của token (S7.4). undefined = server không bật auth (stdio, local). */
  scopes?: readonly string[] | undefined;
  log?: (line: string) => void;
  /** Chờ người dùng trả lời elicitation tối đa bao lâu. */
  elicitTimeoutMs?: number;
};

export const SCOPE_READ = "nexus:read";
export const SCOPE_WRITE = "nexus:write";

const ok = <T extends Record<string, unknown>>(data: T): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
  structuredContent: data,
});
const fail = (message: string): CallToolResult => ({ isError: true, content: [{ type: "text", text: message }] });
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
  });

/**
 * MỘT định nghĩa tool cho mọi transport (stdio, HTTP stateful, stateless, web-standard).
 * Tạo server MỚI mỗi lần gọi: 1 McpServer chỉ nối được 1 transport.
 */
export function buildServer(ctx: ServerCtx): McpServer {
  const canWrite = ctx.scopes === undefined || ctx.scopes.includes(SCOPE_WRITE);
  const server = new McpServer(
    { name: "nexus-m7", version: "0.7.0" },
    { instructions: "Việc nội bộ của team. Ghi (tạo/xóa) chỉ hiện khi token có scope nexus:write." },
  );

  server.registerTool(
    "nexus_whoami",
    {
      title: "Ai đang gọi",
      description: "Trả instance đang phục vụ, danh tính và scope của token, session id (nếu có). Dùng để chẩn đoán kết nối.",
      inputSchema: {},
      outputSchema: { instance: z.string(), subject: z.string().nullable(), scopes: z.array(z.string()), sessionId: z.string().nullable() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (_args, extra) =>
      ok({
        instance: ctx.instance,
        subject: typeof extra.authInfo?.extra?.["sub"] === "string" ? extra.authInfo.extra["sub"] : null,
        scopes: extra.authInfo?.scopes ?? [],
        sessionId: extra.sessionId ?? null,
      }),
  );

  server.registerTool(
    "nexus_list_tasks",
    {
      title: "Danh sách việc",
      description: "Việc của team, lọc theo người phụ trách (owner). Gọi khi cần biết ai đang làm gì.",
      inputSchema: { owner: z.string().min(1).max(40).optional().describe("Tên người phụ trách, ví dụ lan") },
      outputSchema: { instance: z.string(), items: z.array(TaskSchema) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ owner }) => ok({ instance: ctx.instance, items: ctx.store.list(owner) }),
  );

  server.registerTool(
    "nexus_generate_report",
    {
      title: "Báo cáo tiến độ",
      description: "Tổng hợp báo cáo theo từng bước (chạy lâu). Báo progress nếu client gửi progressToken.",
      inputSchema: { steps: z.number().int().min(1).max(10).default(5), delayMs: z.number().int().min(10).max(2000).default(200) },
      outputSchema: { instance: z.string(), steps: z.number(), open: z.number(), done: z.number() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ steps, delayMs }, extra) => {
      const token = extra._meta?.progressToken;
      for (let i = 1; i <= steps; i++) {
        try {
          await sleep(delayMs, extra.signal); // client hủy / mất kết nối → signal abort → dừng thật
        } catch (e) {
          ctx.log?.(`report dừng ở bước ${i}/${steps}: ${extra.signal.aborted ? "signal abort (client hủy hoặc mất kết nối)" : String(e)}`);
          throw e;
        }
        if (token !== undefined) {
          await extra.sendNotification({ method: "notifications/progress", params: { progressToken: token, progress: i, total: steps, message: `bước ${i}/${steps}` } });
        }
      }
      ctx.log?.(`report xong ${steps}/${steps} bước`);
      const all = ctx.store.list();
      return ok({ instance: ctx.instance, steps, open: all.filter((t) => !t.done).length, done: all.filter((t) => t.done).length });
    },
  );

  if (!canWrite) return server; // S7.4: token chỉ có nexus:read → tool ghi KHÔNG tồn tại trong tools/list

  server.registerTool(
    "nexus_create_task",
    {
      title: "Tạo việc",
      description: "Tạo 1 việc mới cho 1 người. Cần scope nexus:write.",
      inputSchema: { title: z.string().min(3).max(120), owner: z.string().min(1).max(40) },
      outputSchema: { instance: z.string(), task: TaskSchema },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ title, owner }, extra) => {
      if (extra.authInfo && !extra.authInfo.scopes.includes(SCOPE_WRITE)) return fail("Token không có scope nexus:write."); // lớp 2
      const task = ctx.store.create(title, owner);
      ctx.log?.(`create ${task.id} by ${String(extra.authInfo?.extra?.["sub"] ?? "local")}`);
      return ok({ instance: ctx.instance, task });
    },
  );

  server.registerTool(
    "nexus_delete_task",
    {
      title: "Xóa việc",
      description: "Xóa hẳn 1 việc. Hỏi người dùng xác nhận (elicitation); client không hỏi được thì KHÔNG xóa.",
      inputSchema: { id: z.string().regex(/^t\d+$/) },
      outputSchema: { instance: z.string(), deleted: z.boolean(), note: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }, extra) => {
      if (extra.authInfo && !extra.authInfo.scopes.includes(SCOPE_WRITE)) return fail("Token không có scope nexus:write.");
      if (!server.server.getClientCapabilities()?.elicitation) {
        return fail("Client này không hỏi được người dùng (không có elicitation) nên không xóa. Đánh dấu xong bằng cách khác.");
      }
      const r = await server.server.elicitInput(
        {
          message: `Xóa hẳn việc ${id}?`,
          requestedSchema: { type: "object", properties: { confirm: { type: "boolean", title: "Tôi đồng ý xóa", default: false } }, required: ["confirm"] },
        },
        { signal: extra.signal, timeout: ctx.elicitTimeoutMs ?? 30_000 },
      );
      if (r.action !== "accept" || r.content?.["confirm"] !== true) return ok({ instance: ctx.instance, deleted: false, note: `người dùng không đồng ý (${r.action})` });
      return ok({ instance: ctx.instance, deleted: ctx.store.delete(id), note: "đã xóa" });
    },
  );

  return server;
}
