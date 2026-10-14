import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DEFAULT_LANGUAGE, PROMPT, RESOURCE, TOOL, WeeklySummaryArgsSchema, type Lang, type Team } from "@nexus/shared";
import { glossaryText } from "../resources/docs.ts";

/** Bảng tra theo team × ngôn ngữ — thiếu ô nào là lỗi compile (M4 · S4.4). */
const FOCUS: Record<Team, Record<Lang, string>> = {
  sales: { vi: "khách mới, khách đổi gói, khách ở từng thành phố", en: "new customers, tier changes, customers per city" },
  cs: { vi: "khách gói enterprise và khách cần chăm sóc", en: "enterprise customers and customers needing attention" },
  finance: { vi: "doanh thu theo tháng và quy đổi ngoại tệ", en: "monthly revenue and currency conversion" },
};

function instruction(team: Team, language: Lang): string {
  const tools = [TOOL.generateReport, TOOL.listCustomers, ...(team === "finance" ? [TOOL.getExchangeRate] : [])].join(", ");
  return language === "vi"
    ? `Viết bản tóm tắt tuần cho nhóm ${team}, tập trung vào ${FOCUS[team].vi}. Gọi các tool: ${tools}. Trình bày 5 gạch đầu dòng, số liệu lấy từ tool, không đoán.`
    : `Write a weekly summary for the ${team} team, focusing on ${FOCUS[team].en}. Call these tools: ${tools}. Use 5 bullet points, numbers from tools only.`;
}

export function registerWeeklySummary(server: McpServer): void {
  server.registerPrompt(
    PROMPT.weeklySummary,
    {
      title: "Tóm tắt tuần theo nhóm",
      description: "Tóm tắt tuần cho sales / cs / finance, dùng số liệu thật từ tool Nexus.",
      argsSchema: WeeklySummaryArgsSchema.shape,
    },
    async ({ team, language = DEFAULT_LANGUAGE }) => ({
      description: `Tóm tắt tuần · ${team} · ${language}`,
      messages: [
        { role: "user", content: { type: "text", text: instruction(team, language) } },
        { role: "user", content: { type: "resource", resource: { uri: RESOURCE.glossary, mimeType: "text/markdown", text: glossaryText() } } },
      ],
    }),
  );
}
