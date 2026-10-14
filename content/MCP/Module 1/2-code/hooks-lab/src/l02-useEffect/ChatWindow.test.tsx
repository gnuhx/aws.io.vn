// COMPONENT TEST + MOCK: thay server thật bằng bản giả để kiểm tra connect/disconnect
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from './chatServer';

// Bản giả: ghi lại ai được kết nối, ai bị ngắt, và cho test tự "bắn" tin nhắn
const fake = vi.hoisted(() => ({
  log: [] as string[],
  push: new Map<string, (m: Message) => void>(),
}));
vi.mock('./chatServer', () => ({
  createConnection: (friend: string) => ({
    connect: () => fake.log.push(`connect ${friend}`),
    disconnect: () => fake.log.push(`disconnect ${friend}`),
    onMessage: (cb: (m: Message) => void) => fake.push.set(friend, cb),
  }),
}));

import ChatWindow from './ChatWindow';

beforeEach(() => {
  fake.log.length = 0;
  fake.push.clear();
});

describe('ChatWindow', () => {
  it('đổi bạn: ngắt người cũ TRƯỚC rồi mới kết nối người mới', () => {
    const { rerender } = render(<ChatWindow friend="An" forgetCleanup={false} />);
    rerender(<ChatWindow friend="Binh" forgetCleanup={false} />);
    expect(fake.log).toEqual(['connect An', 'disconnect An', 'connect Binh']);
  });

  it('đóng chat thì ngắt kết nối', () => {
    const { unmount } = render(<ChatWindow friend="An" forgetCleanup={false} />);
    unmount();
    expect(fake.log.at(-1)).toBe('disconnect An');
  });

  it('tin nhắn tới thì hiện ra và tiêu đề tab có số tin', () => {
    render(<ChatWindow friend="An" forgetCleanup={false} />);
    act(() => fake.push.get('An')!({ id: 1, from: 'An', text: 'alo' }));
    expect(screen.getByText('alo')).toBeInTheDocument();
    expect(document.title).toBe('(1) An | Messenger');
  });

  it('đóng chat thì trả tiêu đề tab về "Facebook"', () => {
    const { unmount } = render(<ChatWindow friend="An" forgetCleanup={false} />);
    act(() => fake.push.get('An')!({ id: 1, from: 'An', text: 'alo' }));
    unmount();
    expect(document.title).toBe('Facebook');
  });
});
