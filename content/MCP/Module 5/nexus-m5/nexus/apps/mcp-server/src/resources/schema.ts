import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";
import { SCHEMA_DOC } from "../query/catalog.ts";

/** M5 · S5.2: schema publish thành resource — host đưa vào context TRƯỚC khi model viết filter. */
export function registerSchema(server: McpServer): void {
  server.registerResource(
    "schema",
    RESOURCE.schema,
    {
      title: "Schema dữ liệu Nexus",
      description: "Collection, field, kiểu và toán tử mà nexus_query chấp nhận. Đưa vào context trước khi model truy vấn dữ liệu.",
      mimeType: "text/markdown",
      size: Buffer.byteLength(SCHEMA_DOC),
      annotations: { audience: ["assistant"], priority: 0.8 },
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: SCHEMA_DOC }] }),
  );
}
