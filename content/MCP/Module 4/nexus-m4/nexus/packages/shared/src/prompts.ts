import { z } from "zod";

export const PROMPT = {
  weeklySummary: "nexus_weekly_summary",
} as const;

export const TEAMS = ["sales", "cs", "finance"] as const;
export const LANGUAGES = ["vi", "en"] as const;
export const DEFAULT_LANGUAGE = "vi" satisfies (typeof LANGUAGES)[number];

// Argument của prompt LUÔN là chuỗi (spec). prompts/list chỉ công bố name + description + required:
// client KHÔNG thấy enum hay default → phải viết chúng vào description.
// Tùy chọn = `.optional()` + mặc định áp trong handler. KHÔNG dùng `.default()`: SDK 1.30 + Zod 4 công bố
// field `.default()` là `required: true` (output thật ở S4.4).
export const WeeklySummaryArgsSchema = z.object({
  team: z
    .enum(TEAMS, { error: `team phải là một trong: ${TEAMS.join(", ")}` })
    .describe(`Nhóm nhận bản tóm tắt: ${TEAMS.join(" | ")}`),
  language: z
    .enum(LANGUAGES, { error: `language phải là một trong: ${LANGUAGES.join(", ")}` })
    .optional()
    .describe(`Ngôn ngữ trả lời: ${LANGUAGES.join(" | ")}. Bỏ trống = ${DEFAULT_LANGUAGE}`),
});
export type WeeklySummaryArgs = z.output<typeof WeeklySummaryArgsSchema>;
