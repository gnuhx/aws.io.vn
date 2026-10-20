import { authErrorResponse, authorize } from "@/lib/dal";
import { deleteWorkspace, getWorkspace, listMembers } from "@/lib/db/workspaces";

// API cho client ngoài (mobile, CLI). proxy.ts KHÔNG chạy ở /api → tự kiểm quyền.
export async function DELETE(_req: Request, ctx: RouteContext<"/api/workspaces/[slug]">) {
  const { slug } = await ctx.params;
  try {
    const { ws } = await authorize(slug, "owner");
    await deleteWorkspace(ws.id);
    return new Response(null, { status: 204 });
  } catch (e) {
    return authErrorResponse(e);
  }
}

// Thêm sau: "proxy.ts đã chặn người lạ rồi" — nhưng matcher bỏ qua /api.
export async function GET(_req: Request, ctx: RouteContext<"/api/workspaces/[slug]">) {
  const { slug } = await ctx.params;
  const ws = await getWorkspace(slug);
  return ws ? Response.json({ ...ws, members: await listMembers(ws.id) }) : new Response(null, { status: 404 });
}
