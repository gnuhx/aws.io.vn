import type { CallToolResult, ContentBlock, JSONRPCMessage, ServerCapabilities, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Direction } from "./connect.ts";

/** 1 khối content → 1 dòng chữ. `switch` đủ 5 loại: thêm loại mới ở spec là tsc đỏ ở đây. */
export function renderContent(c: ContentBlock): string {
  switch (c.type) {
    case "text":
      return c.text;
    case "image":
      return `<image ${c.mimeType}, ${Math.round((c.data.length * 3) / 4)} byte>`;
    case "audio":
      return `<audio ${c.mimeType}, ${Math.round((c.data.length * 3) / 4)} byte>`;
    case "resource":
      return `<resource ${c.resource.uri}${"text" in c.resource ? `, ${c.resource.text.length} ký tự` : ""}>`;
    case "resource_link":
      return `<link ${c.uri} ${c.name}>`;
  }
}

export function renderToolResult(r: CallToolResult): string {
  const body = r.content.map(renderContent).join("\n");
  return r.isError ? `[isError] ${body}` : body;
}

const flag = (on: boolean | undefined, ch: string): string => (on ? ch : "·");

/** R = readOnlyHint · D = destructiveHint · I = idempotentHint · O = openWorldHint */
export function renderTool(t: Tool): string {
  const a = t.annotations ?? {};
  const req = (t.inputSchema.required ?? []).join(", ");
  return `${flag(a.readOnlyHint, "R")}${flag(a.destructiveHint, "D")}${flag(a.idempotentHint, "I")}${flag(a.openWorldHint, "O")}  ${t.name.padEnd(24)} ${req ? `cần: ${req}` : ""}`.trimEnd();
}

export function renderCaps(caps: ServerCapabilities | undefined): string[] {
  const c = caps ?? {};
  const sub = (o: object | undefined, keys: string[]): string =>
    o === undefined ? "— (không khai báo)" : keys.filter((k) => (o as Record<string, unknown>)[k]).join(", ") || "✓";
  return [
    `  tools        ${sub(c.tools, ["listChanged"])}`,
    `  resources    ${sub(c.resources, ["subscribe", "listChanged"])}`,
    `  prompts      ${sub(c.prompts, ["listChanged"])}`,
    `  completions  ${sub(c.completions, [])}`,
    `  logging      ${sub(c.logging, [])}`,
  ];
}

/** Dòng trace gọn: hướng · id · method · tóm tắt kết quả. */
export function renderTrace(dir: Direction, m: JSONRPCMessage): string {
  const id = "id" in m ? `#${String(m.id)}` : "  ";
  if ("method" in m) return `${dir} ${id} ${m.method}`;
  if ("error" in m) return `${dir} ${id} error ${m.error.code} ${m.error.message}`;
  const keys = Object.keys(m.result).filter((k) => k !== "_meta");
  return `${dir} ${id} result {${keys.join(", ")}}`;
}
