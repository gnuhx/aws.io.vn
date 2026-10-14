import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { DEFAULT_LANGUAGE, PROMPT, RESOURCE, TOOL, WeeklySummaryArgsSchema, type WeeklySummaryArgs } from "@nexus/shared";
import { glossaryText } from "../resources/docs.ts";

type Team = WeeklySummaryArgs["team"];
type Lang = NonNullable<WeeklySummaryArgs["language"]>;

const FOCUS: Record<Team, Record<Lang, string>> = {
  sales: {
    vi: "khách mới trong tuần và các lần nâng gói (free → pro → enterprise)",
    en: "new customers this week and tier upgrades (free → pro → enterprise)",
  },
  cs: {
    vi: "khách enterprise, các lần hạ gói và khách rời bỏ (churn)",
    en: "enterprise customers, downgrades and churned customers",
  },
  finance: {
    vi: "số khách trả phí (pro + enterprise) theo thành phố và tỷ giá USD/VND hiện tại",
    en: "paying customers (pro + enterprise) by city and the current USD/VND rate",
  },
};

function instruction(team: Team, lang: Lang): string {
  const tools = `${TOOL.generateReport}, ${TOOL.listCustomers}` + (team === "finance" ? `, ${TOOL.getExchangeRate}` : "");
  return lang === "vi"
    ? `Viết bản tóm tắt tuần cho nhóm ${team}, tập trung vào ${FOCUS[team].vi}. ` +
        `Lấy số liệu bằng các tool: ${tools}. Hiểu thuật ngữ theo tài liệu đính kèm. ` +
        "Trình bày: 3 gạch đầu dòng số liệu chính, 1 đoạn nhận xét, 1 việc nên làm tuần tới. Tool lỗi thì nói rõ, không đoán số."
    : `Write the weekly summary for the ${team} team, focusing on ${FOCUS[team].en}. ` +
        `Get the numbers with these tools: ${tools}. Use the attached glossary for business terms. ` +
        "Format: 3 bullet points of key numbers, 1 paragraph of commentary, 1 action for next week. If a tool fails, say so; never guess numbers.";
}

/**
 * Prompt = workflow do NGƯỜI DÙNG chọn (menu / slash command của host).
 * Mặc định của argument nằm ở SERVER (handler: `language = DEFAULT_LANGUAGE`) và được ghi vào description —
 * client chỉ biết `required: false`, không biết giá trị mặc định.
 */
export function registerWeeklySummary(server: McpServer): void {
  server.registerPrompt(
    PROMPT.weeklySummary,
    {
      title: "Tóm tắt tuần theo nhóm",
      description: "Soạn bản tóm tắt tuần cho 1 nhóm (sales | cs | finance) từ số liệu Nexus. language: vi | en, mặc định vi.",
      argsSchema: WeeklySummaryArgsSchema.shape,
    },
    async ({ team, language = DEFAULT_LANGUAGE }): Promise<GetPromptResult> => ({
      description: `Tóm tắt tuần · ${team} · ${language}`,
      messages: [
        { role: "user", content: { type: "text", text: instruction(team, language) } },
        {
          role: "user",
          // Nhúng NGUYÊN resource vào prompt: model có thuật ngữ mà host không cần đọc thêm
          content: { type: "resource", resource: { uri: RESOURCE.glossary, mimeType: "text/markdown", text: glossaryText() } },
        },
      ],
    }),
  );
}
