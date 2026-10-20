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
  // Dịch thẳng từ [FromForm] CreateWorkspaceDto dto: tin là form đã đúng kiểu
  const dto = { name: formData.get("name"), slug: formData.get("slug") };
  const raw = { name: String(dto.name), slug: String(dto.slug) };
  const parsed = { data: dto };

  try {
    await createWorkspace(parsed.data, "lan@nexus.dev"); // S9.4: lấy từ session
  } catch (e) {
    if (e instanceof SlugTakenError) return { errors: { slug: [`"${e.message}" đã có người dùng`] }, values: raw };
    throw e; // lỗi lạ → error.tsx
  }
  redirect(`/${parsed.data.slug}/chat`); // ném NEXT_REDIRECT — để NGOÀI try/catch
}
