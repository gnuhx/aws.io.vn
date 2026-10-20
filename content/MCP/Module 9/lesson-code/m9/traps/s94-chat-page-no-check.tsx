import { getWorkspace, listMessages } from "@/lib/db/workspaces";

// "Layout đã authorizePage rồi" → page bỏ kiểm tra cho gọn.
export default async function ChatPage({ params }: PageProps<"/[workspace]/chat">) {
  const { workspace } = await params;
  const ws = await getWorkspace(workspace);
  const messages = ws ? await listMessages(ws.id) : [];
  return (
    <ol>
      {messages.map((m) => (
        <li key={m.id}><b>{m.author}</b>: {m.text}</li>
      ))}
    </ol>
  );
}
