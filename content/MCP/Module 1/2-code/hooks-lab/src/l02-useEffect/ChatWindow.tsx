import { useEffect, useState } from 'react';
import { createConnection, type Message } from './chatServer';

type Props = { friend: string; forgetCleanup: boolean };

export default function ChatWindow({ friend, forgetCleanup }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  // EFFECT 1 — stay connected to the friend we're chatting with
  useEffect(() => {
    const conn = createConnection(friend);
    conn.onMessage((m) => setMessages((prev) => [...prev, m]));
    conn.connect();

    if (forgetCleanup) return; // ❌ the bug: never disconnect
    return () => conn.disconnect(); // ✅ cleanup
  }, [friend, forgetCleanup]);

  // EFFECT 2 — keep the browser tab title in sync
  useEffect(() => {
    document.title = messages.length > 0 ? `(${messages.length}) ${friend} | Messenger` : 'Messenger';
    return () => { document.title = 'Facebook'; }; // put the title back when the chat closes
  }, [friend, messages.length]);

  return (
    <section className="card" aria-label={`Chat with ${friend}`}>
      <p><strong>{friend}</strong></p>
      <ul data-testid="messages" style={{ listStyle: 'none', padding: 0, maxHeight: 160, overflow: 'auto' }}>
        {messages.map((m) => (
          <li key={m.id} className="comment"><strong>{m.from}</strong> {m.text}</li>
        ))}
      </ul>
    </section>
  );
}
