// CỐ Ý LỖI (S8.1 · Bẫy 4): ma trận thiếu 1 tool → tsc chặn. Kiểm bằng: npx tsc -p traps-tsc/tsconfig.json
const TOOL = { ping: "nexus_ping", getTime: "nexus_get_time", exportTasks: "nexus_export_tasks" } as const;
type ToolName = (typeof TOOL)[keyof typeof TOOL];
type Row = { ok: () => Promise<void>; input: (() => Promise<void>) | { na: string } };

export const MATRIX = {
  [TOOL.ping]: { ok: async () => {}, input: { na: "không có inputSchema" } },
  [TOOL.getTime]: { ok: async () => {}, input: { na: "không có inputSchema" } },
} satisfies Record<ToolName, Row>;
