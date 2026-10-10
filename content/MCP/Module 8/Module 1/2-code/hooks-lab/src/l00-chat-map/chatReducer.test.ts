// UNIT TEST: hàm thuần, không React, không DOM — nhanh nhất, nên có nhiều nhất
import { describe, expect, it } from 'vitest';
import { chatReducer, groupByDayAndSender, type Msg, type State } from './chatReducer';

const empty: State = { messages: [], draft: '', friendTyping: false };
const msg = (over: Partial<Msg> = {}): Msg => ({
  id: 'm1', from: 'me', text: 'hi', at: Date.parse('2026-10-03T09:00:00'), status: 'sending', ...over,
});

describe('chatReducer', () => {
  it('gửi tin: thêm tin vào cuối và xoá bản nháp', () => {
    const before = { ...empty, draft: 'hi' };
    const after = chatReducer(before, { type: 'sent', msg: msg() });
    expect(after.messages).toHaveLength(1);
    expect(after.draft).toBe('');
  });

  it('server xác nhận: chỉ đổi status của đúng tin đó', () => {
    const s = { ...empty, messages: [msg({ id: 'a' }), msg({ id: 'b' })] };
    const after = chatReducer(s, { type: 'acked', id: 'b' });
    expect(after.messages.map((m) => m.status)).toEqual(['sending', 'sent']);
  });

  it('tin của bạn tới thì tắt "đang soạn tin"', () => {
    const s = { ...empty, friendTyping: true };
    const after = chatReducer(s, { type: 'received', msg: msg({ from: 'them' }) });
    expect(after.friendTyping).toBe(false);
  });

  it('không sửa state cũ (immutable)', () => {
    const before = { ...empty, messages: [msg()] };
    const after = chatReducer(before, { type: 'reacted', id: 'm1', emoji: '❤️' });
    expect(before.messages[0].reaction).toBeUndefined();
    expect(after.messages[0].reaction).toBe('❤️');
    expect(after).not.toBe(before);
  });
});

describe('groupByDayAndSender', () => {
  it('gom tin liền nhau của cùng người, tách khi đổi người hoặc đổi ngày', () => {
    const groups = groupByDayAndSender([
      msg({ id: '1', from: 'them' }),
      msg({ id: '2', from: 'them' }),
      msg({ id: '3', from: 'me' }),
      msg({ id: '4', from: 'me', at: Date.parse('2026-10-04T09:00:00') }),
    ]);
    expect(groups.map((g) => g.items.map((m) => m.id))).toEqual([['1', '2'], ['3'], ['4']]);
  });
});
