import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Hỏi người dùng giữa chừng (elicitation, form mode) — KHÔNG BAO GIỜ hỏi bí mật.
 * Chặn 2 lớp: kiểu (tên field chứa từ "bí mật" → lỗi compile) và lúc chạy (key + title + description).
 */
type SecretWord = "password" | "passwd" | "pass" | "token" | "secret" | "apikey" | "api_key" | "otp" | "pin" | "cvv" | "card" | "matkhau";

export type Field =
  | { type: "boolean"; title: string; description?: string; default?: boolean }
  | { type: "string"; title: string; description?: string; enum?: readonly string[]; maxLength?: number }
  | { type: "number"; title: string; description?: string; minimum?: number; maximum?: number };

/** Field có tên chứa từ bí mật → kiểu của nó thành `never` → truyền vào là lỗi compile. */
export type NoSecrets<F> = { [K in keyof F]: K extends string ? (Lowercase<K> extends `${string}${SecretWord}${string}` ? never : F[K]) : never };

type ValueOf<T extends Field> = T extends { type: "boolean" } ? boolean : T extends { type: "number" } ? number : string;
export type Answers<F extends Record<string, Field>> = { [K in keyof F]?: ValueOf<F[K]> };

export type AskResult<F extends Record<string, Field>> =
  | { action: "accept"; values: Answers<F> }
  | { action: "decline" | "cancel" }
  | { action: "unsupported" };

const SECRET_RE = /pass|token|secret|api[_-]?key|otp|\bpin\b|cvv|card|mật khẩu|mat ?khau/i;

export async function askUser<const F extends Record<string, Field>>(
  server: Server,
  message: string,
  fields: F & NoSecrets<F>,
  opts: RequestOptions = {},
): Promise<AskResult<F>> {
  for (const [k, f] of Object.entries(fields as Record<string, Field>)) {
    if (SECRET_RE.test(k) || SECRET_RE.test(f.title) || SECRET_RE.test(f.description ?? "")) {
      throw new Error(`từ chối elicitation: field "${k}" trông như bí mật — không bao giờ hỏi qua elicitation`);
    }
  }
  if (!server.getClientCapabilities()?.elicitation) return { action: "unsupported" };
  const required = Object.entries(fields as Record<string, Field>).filter(([, f]) => f.type === "boolean").map(([k]) => k);
  const r = await server.elicitInput(
    { mode: "form", message, requestedSchema: { type: "object", properties: fields as Record<string, Field & object>, required } },
    opts,
  );
  if (r.action !== "accept") return { action: r.action };
  return { action: "accept", values: (r.content ?? {}) as Answers<F> };
}
