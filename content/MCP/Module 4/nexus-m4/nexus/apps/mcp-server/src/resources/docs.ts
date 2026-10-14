import { readFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";

// Đọc 1 lần lúc khởi động: tài liệu tĩnh, đi cùng mã nguồn (Docker image copy cả src/).
const GLOSSARY = readFileSync(new URL("./glossary.md", import.meta.url), "utf8");
const GLOSSARY_MODIFIED = "2026-09-28T00:00:00Z";

export function registerDocs(server: McpServer): void {
  server.registerResource(
    "glossary",
    RESOURCE.glossary,
    {
      title: "Thuật ngữ nghiệp vụ Nexus",
      description: "Định nghĩa khách hàng, gói dịch vụ, MRR, churn, tuần báo cáo, nhóm nội bộ. Nạp vào context trước khi trả lời câu hỏi nghiệp vụ.",
      mimeType: "text/markdown",
      size: Buffer.byteLength(GLOSSARY),
      annotations: { audience: ["assistant", "user"], priority: 0.9, lastModified: GLOSSARY_MODIFIED },
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: GLOSSARY }] }),
  );
}

export const glossaryText = (): string => GLOSSARY;
