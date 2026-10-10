"use client";

import { useState, type FormEvent } from "react";
import { readNdjson } from "../../lib/chat/read-ndjson.ts";

interface Msg {
  role: "user" | "bot" | "tool";
  text: string;
}

export function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const appendBot = (delta: string) =>
    setMsgs((m) => {
      const last = m.at(-1);
      return last?.role === "bot" ? [...m.slice(0, -1), { ...last, text: last.text + delta }] : [...m, { role: "bot", text: delta }];
    });

  async function send(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: message }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      for await (const ev of readNdjson(res.body)) {
        if (ev.type === "text") appendBot(ev.delta);
        else if (ev.type === "tool_start") setMsgs((m) => [...m, { role: "tool", text: `Đang gọi ${ev.name}…` }]);
        else if (ev.type === "tool_end") setMsgs((m) => [...m, { role: "tool", text: `${ev.ok ? "✓" : "✗"} ${ev.name} (${ev.ms} ms)` }]);
        else if (ev.type === "error") setMsgs((m) => [...m, { role: "bot", text: ev.message }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Không kết nối được máy chủ." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Khung chat">
      <ol style={{ listStyle: "none", padding: 0 }}>
        {msgs.map((m, i) => (
          <li key={i} style={{ margin: "6px 0", color: m.role === "tool" ? "#6b4a33" : undefined, fontWeight: m.role === "user" ? 600 : 400 }}>
            {m.text}
          </li>
        ))}
      </ol>
      <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
        <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>Câu hỏi</label>
        <input id="q" value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1 }} placeholder="Có bao nhiêu khách hàng ở Hà Nội?" />
        <button type="submit" disabled={busy}>Gửi</button>
      </form>
    </section>
  );
}
