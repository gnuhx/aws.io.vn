"use client";

import { useRef, useState, type FormEvent } from "react";
import type { ChatEvent } from "@nexus/shared";

interface Line {
  id: number;
  role: "user" | "assistant" | "tool";
  text: string;
}

export default function ChatPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = new FormData(form).get("q");
    if (typeof q !== "string" || !q.trim()) return;
    form.reset();
    const push = (role: Line["role"], text: string) => setLines((ls) => [...ls, { id: nextId.current++, role, text }]);
    push("user", q);
    const answerId = nextId.current++;
    setLines((ls) => [...ls, { id: answerId, role: "assistant", text: "" }]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
        signal: abort.current.signal,
      });
      if (!res.body) return;
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const p of parts.filter(Boolean)) {
          const ev = JSON.parse(p) as ChatEvent;
          if (ev.type === "text") setLines((ls) => ls.map((l) => (l.id === answerId ? { ...l, text: l.text + ev.delta } : l)));
          if (ev.type === "tool_start") push("tool", `Đang gọi ${ev.name}…`);
          if (ev.type === "tool_end") push("tool", `${ev.isError ? "✗" : "✓"} ${ev.name} (${ev.ms} ms)`);
          if (ev.type === "error") push("tool", ev.message);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Chat</h1>
      <ol aria-live="polite">
        {lines.map((l) => (
          <li key={l.id}>
            <strong>{l.role}:</strong> {l.text}
          </li>
        ))}
      </ol>
      <form onSubmit={send}>
        <label htmlFor="q">Câu hỏi</label> <input id="q" name="q" disabled={busy} />{" "}
        <button type="submit" disabled={busy}>
          Gửi
        </button>{" "}
        <button type="button" onClick={() => abort.current?.abort()} disabled={!busy}>
          Dừng
        </button>
      </form>
    </main>
  );
}
