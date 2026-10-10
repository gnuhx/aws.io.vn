import { z } from "zod";
import { CitySchema, CustomerIdSchema } from "./customer.ts";

export const PROMPT = { weeklySummary: "nexus_weekly_summary", customerBrief: "nexus_customer_brief" } as const;

export const TEAMS = ["sales", "cs", "finance"] as const;
export const LANGUAGES = ["vi", "en"] as const;
export const DEFAULT_LANGUAGE = "vi" satisfies (typeof LANGUAGES)[number];

export const TeamSchema = z
  .enum(TEAMS, { error: `team phải là một trong: ${TEAMS.join(", ")}` })
  .describe(`Nhóm: ${TEAMS.join(" | ")}`);
export const LanguageSchema = z
  .enum(LANGUAGES, { error: `language phải là một trong: ${LANGUAGES.join(", ")}` })
  .describe(`Ngôn ngữ: ${LANGUAGES.join(" | ")} (mặc định ${DEFAULT_LANGUAGE})`);

/** Argument của prompt luôn là chuỗi trên dây; mặc định đặt trong handler, không dùng `.default()` (M4 · Bẫy 1). */
export const WeeklySummaryArgsSchema = z.object({
  team: TeamSchema,
  language: LanguageSchema.optional(),
});
export type Team = (typeof TEAMS)[number];
export type Language = (typeof LANGUAGES)[number];

/** Brief 1 khách trước cuộc gọi. `city` (tùy chọn) thu hẹp gợi ý cho `customer` khi người dùng gõ (S6.3). */
export const CustomerBriefArgsSchema = z.object({
  city: CitySchema.optional().describe("Thành phố — để lọc gợi ý khách (không bắt buộc)"),
  customer: CustomerIdSchema.describe("Mã khách, ví dụ cus_007 — gõ vài chữ của tên để được gợi ý"),
});
