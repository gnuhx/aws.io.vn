// COMPONENT TEST: render thật trong jsdom, thao tác như NGƯỜI DÙNG (theo role/label, không theo class)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PostCard from './PostCard';

describe('PostCard', () => {
  it('bấm Thích thì số like +1, bấm lại thì -1', async () => {
    const user = userEvent.setup();
    render(<PostCard />);
    expect(screen.getByTestId('summary')).toHaveTextContent('👍 41');

    await user.click(screen.getByRole('button', { name: /like/i }));
    expect(screen.getByRole('button', { name: /liked/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('summary')).toHaveTextContent('👍 42');

    await user.click(screen.getByRole('button', { name: /liked/i }));
    expect(screen.getByTestId('summary')).toHaveTextContent('👍 41');
  });

  it('không gửi được bình luận rỗng hoặc toàn dấu cách', async () => {
    const user = userEvent.setup();
    render(<PostCard />);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('Write a comment'), '   ');
    expect(send).toBeDisabled();
  });

  it('gửi bình luận: hiện trong danh sách, ô nhập được xoá, số bình luận tăng', async () => {
    const user = userEvent.setup();
    render(<PostCard />);
    await user.type(screen.getByLabelText('Write a comment'), 'Quá đỉnh{Enter}');
    expect(screen.getByText('Quá đỉnh')).toBeInTheDocument();
    expect(screen.getByLabelText('Write a comment')).toHaveValue('');
    expect(screen.getByTestId('summary')).toHaveTextContent('2 comments');
  });

  it('giữ bản nháp sau khi tải lại trang', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<PostCard />);
    await user.type(screen.getByLabelText('Write a comment'), 'đang gõ dở');
    unmount();                       // "F5"
    render(<PostCard />);
    expect(screen.getByLabelText('Write a comment')).toHaveValue('đang gõ dở');
  });
});
