import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DEFAULT_LANGUAGE, LANGUAGES, PROMPT, RESOURCE, TEAMS, TOOL, WeeklySummaryArgsSchema, type Language, type Team } from "@nexus/shared";
import { glossaryText } from "../resources/glossary.ts";

const BODY: Record<Team, Record<Language, string>> = {
  sales: {
    vi: `Tóm tắt tuần cho nhóm sales. Gọi ${TOOL.getTime} để biết tuần này, ${TOOL.revenueBy} (by=city) cho doanh thu, ${TOOL.listCustomers} cho khách mới. Trình bày: 3 gạch đầu dòng + 1 bảng.`,
    en: `Weekly summary for the sales team. Call ${TOOL.getTime}, ${TOOL.revenueBy} (by=city), ${TOOL.listCustomers}. Format: 3 bullets + 1 table.`,
  },
  cs: {
    vi: `Tóm tắt tuần cho nhóm chăm sóc khách hàng. Gọi ${TOOL.getTime}, rồi ${TOOL.listTasks} (status=todo, dueBefore=hôm nay) để tìm việc quá hạn. Nhóm theo người làm.`,
    en: `Weekly summary for customer success. Call ${TOOL.getTime}, then ${TOOL.listTasks} (status=todo, dueBefore=today). Group by assignee.`,
  },
  finance: {
    vi: `Tóm tắt tuần cho nhóm tài chính. Gọi ${TOOL.revenueBy} (by=month) và ${TOOL.findOrders} (status=pending). Nêu số đơn chờ thanh toán và tổng tiền.`,
    en: `Weekly summary for finance. Call ${TOOL.revenueBy} (by=month) and ${TOOL.findOrders} (status=pending). Report pending count and amount.`,
  },
};

export function registerWeeklySummary(server: McpServer): void {
  server.registerPrompt(
    PROMPT.weeklySummary,
    {
      title: "Tóm tắt tuần theo nhóm",
      description: "Bản tóm tắt tuần cho 1 nhóm (sales | cs | finance), tiếng Việt hoặc tiếng Anh.",
      // completable() bọc schema của shared — packages/shared không phụ thuộc SDK (S6.3).
      // .clone(): completable() GẮN metadata lên chính object schema; schema dùng chung + server thứ 2 → TypeError (Bẫy 5)
      argsSchema: {
        team: completable(WeeklySummaryArgsSchema.shape.team.clone(), (value) => TEAMS.filter((t) => t.startsWith(value.trim().toLowerCase()))),
        language: completable(WeeklySummaryArgsSchema.shape.language.clone(), (value) =>
          LANGUAGES.filter((l) => l.startsWith((value ?? "").trim().toLowerCase())),
        ),
      },
    },
    async ({ team, language }) => {
      const lang = language ?? DEFAULT_LANGUAGE;
      return {
        description: `Tóm tắt tuần · ${team} · ${lang}`,
        messages: [
          { role: "user", content: { type: "text", text: BODY[team][lang] } },
          { role: "user", content: { type: "resource", resource: { uri: RESOURCE.glossary, mimeType: "text/markdown", text: glossaryText() } } },
        ],
      };
    },
  );
}
