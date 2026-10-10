import { ChatPanel } from "./chat-panel.tsx";

export default function ChatPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1>Chat với dữ liệu</h1>
      <ChatPanel />
    </main>
  );
}
