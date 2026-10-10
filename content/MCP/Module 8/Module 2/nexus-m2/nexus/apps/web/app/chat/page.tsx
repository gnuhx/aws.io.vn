import { ChatPanel } from "./chat-panel.tsx";

export const metadata = { title: "Nexus · Chat" };

export default function ChatPage() {
  return (
    <main>
      <h1 style={{ textAlign: "center", fontFamily: "system-ui" }}>Nexus</h1>
      <ChatPanel />
    </main>
  );
}
