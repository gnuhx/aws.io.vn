"use server";
import { revalidateTag } from "next/cache";
import { ChatRequestSchema } from "@nexus/shared";
import { AuthError, authorize } from "@/lib/dal";
import { addMessage } from "@/lib/db/workspaces";
import { statsTag } from "@/lib/data/dashboard";

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendMessageAction(workspace: string, text: string): Promise<SendResult> {
  const parsed = ChatRequestSchema.safeParse({ workspace, text });
  if (!parsed.success) return { ok: false, error: "Tin nhắn trống hoặc quá dài" };
  try {
    const { ws, user } = await authorize(parsed.data.workspace);
    await addMessage(ws.id, user.email, parsed.data.text);
    revalidateTag(statsTag(ws.id), "max"); // quen tay: API "invalidate" ở mọi nơi
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}
