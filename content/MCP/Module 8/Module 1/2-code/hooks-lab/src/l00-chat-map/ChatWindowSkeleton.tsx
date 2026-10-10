// KHUNG — mỗi hook nằm ở đâu trong khung chat Messenger.
// Qua được TypeScript, nhưng server là bản giả. Mỗi phần sẽ thành một bài riêng.
import { memo, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { chatReducer, groupByDayAndSender, type Msg } from './chatReducer';


// server realtime giả
const chatApi = {
  connect(_friendId: string, _on: { message: (m: Msg) => void; typing: (on: boolean) => void }) {
    return () => {}; // trả về hàm "ngắt kết nối"
  },
  send: async (_friendId: string, _text: string) => ({ ok: true }),
  react: async (_msgId: string, _emoji: string) => ({ ok: true }),
};

export default function ChatWindow({ friendId, friendName }: { friendId: string; friendName: string }) {
  const [state, dispatch] = useReducer(chatReducer, { messages: [], draft: '', friendTyping: false });

  // ───────── useRef: giữ phần tử DOM và giá trị KHÔNG được gây render lại ─────────
  const listRef = useRef<HTMLDivElement>(null);   // khung cuộn
  const inputRef = useRef<HTMLInputElement>(null); // ô nhập "Aa"
  const atBottomRef = useRef(true);                // người dùng đang ở cuối chưa? (đổi mỗi lần cuộn)

  // ───────── useEffect: đồng bộ với những thứ NGOÀI React ─────────
  useEffect(() => {                                // 1. kết nối server cho ĐÚNG người bạn này
    return chatApi.connect(friendId, {
      message: (msg) => dispatch({ type: 'received', msg }),
      typing: (on) => dispatch({ type: 'typing', on }),
    });
  }, [friendId]);

  useEffect(() => {                                // 2. focus ô nhập khi mở chat
    inputRef.current?.focus();
  }, [friendId]);

  useEffect(() => {                                // 3. tự cuộn — chỉ khi đang ở cuối
    const el = listRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, state.friendTyping]);

  // ───────── useMemo: dữ liệu suy ra tốn công, chỉ tính lại khi messages đổi ─────────
  const groups = useMemo(() => groupByDayAndSender(state.messages), [state.messages]);
  // gõ phím chỉ đổi state.draft, KHÔNG đổi state.messages → không gom nhóm lại

  // ───────── useCallback: hàm giữ nguyên danh tính cho component con có memo ─────────
  const handleReact = useCallback(
    (id: string, emoji: string) => {
      dispatch({ type: 'reacted', id, emoji }); // bản thân dispatch luôn ổn định
      void chatApi.react(id, emoji);
    },
    [],
  );

  async function handleSend() {                  // event handler thường — không cần hook
    const text = state.draft.trim();
    if (!text) return;
    const msg: Msg = { id: crypto.randomUUID(), from: 'me', text, at: Date.now(), status: 'sending' };
    dispatch({ type: 'sent', msg });
    await chatApi.send(friendId, text);
    dispatch({ type: 'acked', id: msg.id });
  }

  return (
    <section aria-label={`Chat with ${friendName}`}>
      <header>{friendName}</header>
      <div
        ref={listRef}
        style={{ overflowY: 'auto', height: 400 }}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {groups.map((g) => (
          <div key={g.items[0].id} data-from={g.from}>
            {g.items.map((m) => <MessageBubble key={m.id} msg={m} onReact={handleReact} />)}
          </div>
        ))}
        {state.friendTyping && <p>{friendName} is typing…</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }}>
        <input ref={inputRef} aria-label="Message" placeholder="Aa" value={state.draft}
          onChange={(e) => dispatch({ type: 'draft_changed', text: e.target.value })} />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}

// memo: chỉ render lại khi props CỦA NÓ đổi — chạy được vì onReact ổn định
const MessageBubble = memo(function MessageBubble({ msg, onReact }: { msg: Msg; onReact: (id: string, emoji: string) => void }) {
  return (
    <p>
      {msg.text} {msg.reaction} <small>{msg.status === 'sending' ? 'Sending…' : 'Sent'}</small>
      <button type="button" onClick={() => onReact(msg.id, '❤️')} aria-label="React with heart">♡</button>
    </p>
  );
});
