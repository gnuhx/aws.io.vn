import "server-only";
// import { connection } from "next/server";
import type { Role } from "@nexus/shared";

// Thay MongoDB trong sandbox (không kéo được image): cùng hợp đồng async, có độ trễ như gọi mạng.
export type Workspace = { id: string; slug: string; name: string; createdAt: Date };
export type Member = { workspaceId: string; email: string; role: Role };
export type Message = { id: string; workspaceId: string; author: string; text: string; at: Date };

const DB_URL = process.env.NEXUS_DB_URL ?? "mongodb://nexus:s3cret-only-on-server@db:27017/nexus";
const LATENCY_MS = Number(process.env.NEXUS_DB_LATENCY_MS ?? 120);

type Db = { workspaces: Workspace[]; members: Member[]; messages: Message[]; url: string };
const g = globalThis as typeof globalThis & { __nexusDb?: Db };
export const db: Db = (g.__nexusDb ??= {
  url: DB_URL,
  workspaces: [
    { id: "ws_1", slug: "acme", name: "Acme Coffee", createdAt: new Date("2026-09-01") },
    { id: "ws_2", slug: "bean-co", name: "Bean & Co", createdAt: new Date("2026-09-12") },
  ],
  members: [
    { workspaceId: "ws_1", email: "lan@nexus.dev", role: "owner" },
    { workspaceId: "ws_1", email: "minh@nexus.dev", role: "member" },
    { workspaceId: "ws_2", email: "an@nexus.dev", role: "owner" },
  ],
  messages: [
    { id: "m_1", workspaceId: "ws_1", author: "lan@nexus.dev", text: "Doanh thu tuần này?", at: new Date("2026-10-14T09:00:00Z") },
    { id: "m_2", workspaceId: "ws_2", author: "an@nexus.dev", text: "Khách nào sắp hết hạn?", at: new Date("2026-10-14T10:00:00Z") },
  ],
});

/** Mọi truy vấn đi qua đây: đọc DB = phải chạy lúc có request, không lúc build. */
export async function query<T>(fn: (d: Db) => T, ms = LATENCY_MS): Promise<T> {
  // (quên) await connection();
  await new Promise((r) => setTimeout(r, ms));
  return structuredClone(fn(db));
}
