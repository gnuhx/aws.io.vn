import type { CallToolResult, ResourceLink } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * 2 kết cục hợp lệ của 1 tool (M3 · S3.3):
 *  - toolOk: dữ liệu khớp outputSchema → structuredContent + bản text JSON cho host không đọc structured.
 *  - toolFail: lỗi nghiệp vụ model đọc được — "chuyện gì xảy ra" + "làm gì tiếp".
 */
export function toolOk<S extends z.ZodType>(schema: S, data: z.infer<S>): CallToolResult {
  const structured = schema.parse(data) as Record<string, unknown>;
  return {
    structuredContent: structured,
    content: [{ type: "text", text: JSON.stringify(structured) }],
  };
}

export interface Failure {
  what: string;
  next: string;
}

export function toolFail({ what, next }: Failure): CallToolResult {
  return { isError: true, content: [{ type: "text", text: `${what} ${next}` }] };
}

/** M4 · S4.5: 1 câu tóm tắt + resource_link thay vì nội dung. */
export function toolOkLinks<S extends z.ZodType>(
  schema: S,
  data: z.infer<S>,
  summary: string,
  links: readonly ResourceLink[],
): CallToolResult {
  const structured = schema.parse(data) as Record<string, unknown>;
  return { structuredContent: structured, content: [{ type: "text", text: summary }, ...links] };
}
