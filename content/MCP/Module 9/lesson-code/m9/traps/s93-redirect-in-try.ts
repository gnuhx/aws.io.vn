"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateWorkspaceSchema } from "@nexus/shared";
import { createWorkspace, SlugTakenError } from "@/lib/db/workspaces";

export type FormState = {
  errors?: Partial<Record<"name" | "slug" | "form", string[]>>;
  values?: { name: string; slug: string };
};

// Server Action = 1 endpoint POST công khai. Không tin gì từ client, kể cả kiểu dữ liệu.
export async function createWorkspaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { name: String(formData.get("name") ?? ""), slug: String(formData.get("slug") ?? "") };
  const parsed = CreateWorkspaceSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: raw };

  try {
    await createWorkspace(parsed.data, "lan@nexus.dev");
    redirect(`/${parsed.data.slug}/chat`); // gom hết vào try như try/catch quanh controller C#
  } catch (e) {
    if (e instanceof SlugTakenError) return { errors: { slug: [`"${e.message}" đã có người dùng`] }, values: raw };
    return { errors: { form: [`Có lỗi: ${String(e)}`] }, values: raw };
  }
}
