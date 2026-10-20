"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateWorkspaceSchema } from "@nexus/shared";
import { createWorkspace, deleteWorkspace, getWorkspace, SlugTakenError } from "@/lib/db/workspaces";
import { AuthError, authorize, requireUser } from "@/lib/dal";

export type FormState = {
  errors?: Partial<Record<"name" | "slug" | "form", string[]>>;
  values?: { name: string; slug: string };
};

// Server Action = 1 endpoint POST công khai. Không tin gì từ client, kể cả kiểu dữ liệu.
export async function createWorkspaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = { name: String(formData.get("name") ?? ""), slug: String(formData.get("slug") ?? "") };
  const parsed = CreateWorkspaceSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: raw };

  try {
    await createWorkspace(parsed.data, user.email);
  } catch (e) {
    if (e instanceof SlugTakenError) return { errors: { slug: [`"${e.message}" đã có người dùng`] }, values: raw };
    throw e; // lỗi lạ → error.tsx
  }
  redirect(`/${parsed.data.slug}/chat`); // ném NEXT_REDIRECT — để NGOÀI try/catch
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

// Nút xóa chỉ hiện với owner — nhưng ai cũng gửi được POST tới action này. Kiểm quyền Ở ĐÂY.
export async function deleteWorkspaceAction(slug: string): Promise<DeleteResult> {
  try {
    await requireUser(); // "nút Xóa chỉ hiện với owner rồi" → chỉ cần đã đăng nhập
    const ws = await getWorkspace(slug);
    if (!ws) return { ok: false, error: "Không có workspace này" };
    await deleteWorkspace(ws.id);
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}
