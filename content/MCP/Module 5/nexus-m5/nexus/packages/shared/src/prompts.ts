import { z } from "zod";

export const PROMPT = { weeklySummary: "nexus_weekly_summary" } as const;

export const TEAMS = ["sales", "cs", "finance"] as const;
export const LANGUAGES = ["vi", "en"] as const;
export const DEFAULT_LANGUAGE = "vi" as const satisfies (typeof LANGUAGES)[number];

/** Argument prompt luôn là chuỗi; mặc định áp trong handler, không dùng .default() (M4 · S4.4). */
export const WeeklySummaryArgsSchema = z.object({
  team: z.enum(TEAMS, { error: `team phải là một trong: ${TEAMS.join(", ")}` }).describe(`Nhóm: ${TEAMS.join(" | ")}`),
  language: z
    .enum(LANGUAGES, { error: `language phải là một trong: ${LANGUAGES.join(", ")}` })
    .optional()
    .describe(`Ngôn ngữ: ${LANGUAGES.join(" | ")} (mặc định ${DEFAULT_LANGUAGE})`),
});
export type Team = (typeof TEAMS)[number];
export type Lang = (typeof LANGUAGES)[number];
