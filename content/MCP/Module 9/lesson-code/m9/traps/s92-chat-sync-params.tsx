import { getWorkspace, listMessages } from "@/lib/db/workspaces";

export default async function ChatPage({ params }: PageProps<"/[workspace]/chat">) {
  const ws = await getWorkspace(params.workspace); // quen tay từ Next 14 / ASP.NET route value
  const messages = ws ? await listMessages(ws.id) : [];
  return (
    <ol>
      {messages.map((m) => (
        <li key={m.id}><b>{m.author}</b>: {m.text}</li>
      ))}
    </ol>
  );
}
