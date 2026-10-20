import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { authorizePage } from "@/lib/dal";
import { getStats } from "@/lib/db/workspaces";

export const statsTag = (workspaceId: string) => `ws:${workspaceId}:stats`;

// "Cache luôn cả đoạn kiểm quyền cho nhanh" — giống [OutputCache] đặt trên action có [Authorize].
export async function getDashboard(slug: string) {
  "use cache";
  cacheLife("hours");
  const { ws, role } = await authorizePage(slug);
  cacheTag(statsTag(ws.id));
  return { ws, role, stats: await getStats(ws.id) };
}
