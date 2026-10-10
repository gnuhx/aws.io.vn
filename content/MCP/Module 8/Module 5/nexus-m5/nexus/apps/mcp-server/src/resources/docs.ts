import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";
import { readFileSync, statSync } from "node:fs";

// Module singleton: đọc 1 lần lúc import, theo vị trí file mã nguồn (không theo cwd) — M4 · S4.1
const FILE = new URL("./glossary.md", import.meta.url);
const GLOSSARY = readFileSync(FILE, "utf8");
const MODIFIED = statSync(FILE).mtime.toISOString();

export const glossaryText = (): string => GLOSSARY;

export function registerDocs(server: McpServer): void {
  server.registerResource(
    "glossary",
    RESOURCE.glossary,
    {
      title: "Thuật ngữ nghiệp vụ Nexus",
      description: "Định nghĩa khách hàng, gói, MRR, churn, doanh thu, ticket, task. Đưa vào context khi câu hỏi dùng thuật ngữ nghiệp vụ.",
      mimeType: "text/markdown",
      size: Buffer.byteLength(GLOSSARY),
      annotations: { audience: ["assistant", "user"], priority: 0.9, lastModified: MODIFIED },
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: GLOSSARY }] }),
  );
}
