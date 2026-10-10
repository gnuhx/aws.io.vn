"use client";

import { useRef, useState, type FormEvent } from "react";
import { readNdjson } from "@/lib/chat/read-ndjson.ts";

type Line = { id: string; kind: "user" | "bot" | "tool" | "error"; text: string };
const line = (kind: Line["kind"], text: string): Line => ({ id: crypto.randomUUID(), kind, text });

export function ChatPanel() {
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function appendBot(delta: string) {
    setLines((prev) => {
      const last = prev.at(-1);
      if (last?.kind === "bot") return [...prev.slice(0, -1), { ...last, text: last.text + delta }];
      return [...prev, line("bot", delta)];
    });
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const message = String(new FormData(form).get("message") ?? "").trim();
    if (!message || busy) return;
    form.reset();
    setLines((prev) => [...prev, line("user", message)]);
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      for await (const ev of readNdjson(res.body)) {
        switch (ev.type) {
          case "text": appendBot(ev.delta); break;
          case "tool_start": setLines((p) => [...p, line("tool", `Đang gọi ${ev.name}…`)]); break;
          case "tool_end": setLines((p) => [...p, line("tool", `${ev.ok ? "✓" : "✗"} ${ev.name} (${ev.ms} ms)`)]); break;
          case "error": setLines((p) => [...p, line("error", ev.message)]); break;
          case "done": break;
        }
      }
    } catch (err) {
      if (!ac.signal.aborted) setLines((p) => [...p, line("error", String(err))]);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <section aria-label="Chat" style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <ol aria-live="polite" style={{ listStyle: "none", padding: 0, minHeight: 240 }}>
        {lines.map((l) => (
          <li key={l.id} data-kind={l.kind} style={{ margin: "6px 0", opacity: l.kind === "tool" ? 0.7 : 1 }}>
            <strong>{l.kind === "user" ? "Bạn" : l.kind === "bot" ? "Nexus" : l.kind === "tool" ? "Tool" : "Lỗi"}:</strong> {l.text}
          </li>
        ))}
      </ol>
      <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
        <label htmlFor="message" style={{ position: "absolute", left: -9999 }}>Câu hỏi</label>
        <input id="message" name="message" placeholder="Có bao nhiêu khách hàng ở Hà Nội?" style={{ flex: 1, padding: 8 }} />
        <button type="submit" disabled={busy}>Gửi</button>
        <button type="button" disabled={!busy} onClick={() => abortRef.current?.abort()}>Dừng</button>
      </form>
    </section>
  );
}
