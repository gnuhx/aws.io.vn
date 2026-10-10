import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ElicitRequestSchema, type ElicitRequestFormParams, type ElicitResult } from "@modelcontextprotocol/sdk/types.js";

/** Trả lời tự động cho demo/test: yes = đồng ý, no = gửi form với confirm=false, decline / cancel = như người bấm nút. */
export const ELICIT_MODES = ["yes", "no", "decline", "cancel"] as const;
export type ElicitMode = (typeof ELICIT_MODES)[number];
export const isElicitMode = (s: string): s is ElicitMode => (ELICIT_MODES as readonly string[]).includes(s);

const SECRET_RE = /pass|token|secret|api[_-]?key|otp|\bpin\b|cvv|card|mật khẩu|mat ?khau/i;

function showForm(p: ElicitRequestFormParams): string {
  const fields = Object.entries(p.requestedSchema.properties).map(([k, f]) => {
    const extra = "enum" in f && f.enum ? ` [${f.enum.join(" | ")}]` : "";
    return `│   ${k}: ${f.type}${extra} — ${f.title ?? ""}`;
  });
  return [`┌ server hỏi bạn: ${p.message}`, ...fields].join("\n");
}

/**
 * Client cũng chặn: form hỏi thứ trông như bí mật → tự decline (phòng server viết sai / server độc).
 * Spec: server KHÔNG ĐƯỢC hỏi thông tin nhạy cảm qua elicitation; client nên cho người dùng thấy ai đang hỏi.
 */
export function enableElicitation(client: Client, mode: ElicitMode, log: (s: string) => void): void {
  client.setRequestHandler(ElicitRequestSchema, async (req): Promise<ElicitResult> => {
    if (req.params.mode === "url") {
      log("┌ server xin mở URL — client này không hỗ trợ → decline");
      return { action: "decline" };
    }
    const p = req.params;
    log(showForm(p));
    const secret = Object.entries(p.requestedSchema.properties).find(([k, f]) => SECRET_RE.test(k) || SECRET_RE.test(f.title ?? ""));
    if (secret) {
      log(`└ ✗ form hỏi "${secret[0]}" — trông như bí mật, client tự từ chối`);
      return { action: "decline" };
    }
    if (mode === "decline" || mode === "cancel") {
      log(`└ ${mode === "decline" ? "✗ bấm Từ chối" : "✗ đóng hộp thoại"}`);
      return { action: mode };
    }
    const content: Record<string, string | number | boolean> = {};
    for (const [k, f] of Object.entries(p.requestedSchema.properties)) {
      if (f.type === "boolean") content[k] = mode === "yes";
      else if ("enum" in f && f.enum?.[0] !== undefined) content[k] = f.enum[0];
    }
    log(`└ ✓ gửi ${JSON.stringify(content)}`);
    return { action: "accept", content };
  });
}
