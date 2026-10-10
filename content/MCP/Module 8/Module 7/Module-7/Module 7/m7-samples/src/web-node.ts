import { serve } from "@hono/node-server";
import { createFetchHandler } from "./web.ts";
import { createMemoryStore } from "./store.ts";

// Chạy fetch handler trên Node: adapter đổi IncomingMessage ↔ Request/Response. Trên Workers: `export default { fetch: handler }`.
const port = Number(process.env["PORT"] ?? 3501);
const handler = createFetchHandler({
  store: createMemoryStore(),
  instance: "web",
  guard: { allowedHosts: ["127.0.0.1", "localhost"], allowedOrigins: [] },
  cache: { listTtlMs: Number(process.env["CACHE_LIST_TTL_MS"] ?? 300_000), readTtlMs: 0 },
});
serve({ fetch: handler, port, hostname: "127.0.0.1" }, () => process.stderr.write(`[web] MCP web-standard tại http://127.0.0.1:${port}/mcp\n`));
