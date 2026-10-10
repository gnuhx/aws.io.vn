// URI resource của Nexus — MỘT nguồn cho server (đăng ký), host (web đọc glossary), tool (resource_link).
// Quy ước: nexus://<nhóm>/<định danh>. Scheme riêng vì client KHÔNG tự tải được — phải đọc qua MCP server
// (spec: https:// chỉ dùng khi client tự fetch được).

export const RESOURCE = {
  glossary: "nexus://docs/glossary",
  customersByCityChart: "nexus://charts/customers-by-city.png",
} as const;

export const RESOURCE_TEMPLATE = {
  customer: "nexus://customers/{id}",
} as const;

export const customerUri = (id: string): string => `nexus://customers/${encodeURIComponent(id)}`;

export type ResourceUri = (typeof RESOURCE)[keyof typeof RESOURCE];
