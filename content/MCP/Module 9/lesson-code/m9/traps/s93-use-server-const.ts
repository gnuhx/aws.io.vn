"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CreateWorkspaceSchema } from "@nexus/shared";
import { createWorkspace, SlugTakenError } from "@/lib/db/workspaces";

export const MAX_WORKSPACES = 5; // hằng dùng chung cho form và action

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
    await createWorkspace(parsed.data, "lan@nexus.dev"); // S9.4: lấy từ session
  } catch (e) {
    if (e instanceof SlugTakenError) return { errors: { slug: [`"${e.message}" đã có người dùng`] }, values: raw };
    throw e; // lỗi lạ → error.tsx
  }
  redirect(`/${parsed.data.slug}/chat`); // ném NEXT_REDIRECT — để NGOÀI try/catch
}
