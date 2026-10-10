import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE } from "@nexus/shared";

export function glossaryText(): string {
  return [
    "# Thuật ngữ Nexus",
    "",
    "- **Khách (customer)**: tổ chức mua hàng, id dạng cus_xxx.",
    "- **Gói (tier)**: free | pro | enterprise.",
    "- **Doanh thu**: tổng tiền các đơn có trạng thái paid; tháng tính theo giờ Việt Nam.",
    "- **Việc (task)**: việc nội bộ của team gắn với 1 người, có thể gắn khách và hạn.",
    "- **Quá hạn**: việc chưa done có dueDate trước hôm nay (giờ VN).",
  ].join("\n");
}

export function registerGlossary(server: McpServer): void {
  server.registerResource(
    "glossary",
    RESOURCE.glossary,
    { title: "Thuật ngữ nghiệp vụ", description: "Định nghĩa các từ Nexus dùng — host nạp vào system prompt", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: glossaryText() }] }),
  );
}
