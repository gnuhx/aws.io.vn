// Reducer của khung chat — tách ra file riêng để test được mà không cần React.
export type Msg = { id: string; from: 'me' | 'them'; text: string; at: number; status: 'sending' | 'sent'; reaction?: string };

// ───────── useReducer: TOÀN BỘ state của chat + mọi cách nó thay đổi, gom 1 chỗ ─────────
export type State = { messages: Msg[]; draft: string; friendTyping: boolean };
export type Action =
  | { type: 'draft_changed'; text: string }
  | { type: 'sent'; msg: Msg }
  | { type: 'acked'; id: string }
  | { type: 'received'; msg: Msg }
  | { type: 'typing'; on: boolean }
  | { type: 'reacted'; id: string; emoji: string };

export function chatReducer(state: State, a: Action): State {
  switch (a.type) {
    case 'draft_changed': return { ...state, draft: a.text };
    case 'sent':          return { ...state, draft: '', messages: [...state.messages, a.msg] };
    case 'acked':         return { ...state, messages: state.messages.map((m) => (m.id === a.id ? { ...m, status: 'sent' } : m)) };
    case 'received':      return { ...state, friendTyping: false, messages: [...state.messages, a.msg] };
    case 'typing':        return { ...state, friendTyping: a.on };
    case 'reacted':       return { ...state, messages: state.messages.map((m) => (m.id === a.id ? { ...m, reaction: a.emoji } : m)) };
  }
}

export type Group = { day: string; from: Msg['from']; items: Msg[] };
export function groupByDayAndSender(messages: Msg[]): Group[] {
  const groups: Group[] = [];
  for (const m of messages) {
    const day = new Date(m.at).toDateString();
    const last = groups.at(-1);
    if (last && last.day === day && last.from === m.from) last.items.push(m);
    else groups.push({ day, from: m.from, items: [m] });
  }
  return groups;
}

