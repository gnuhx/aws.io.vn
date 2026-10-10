import type { MouseEvent } from 'react'

/**
 * Link “bỏ qua” — phần tử đầu tiên người dùng bàn phím gặp.
 * KHÔNG để trình duyệt tự nhảy tới #main: app dùng hash để định tuyến,
 * đổi hash thành #main sẽ đưa người dùng tới trang “Không tìm thấy”.
 */
export function SkipLink() {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }

  return (
    <a
      href="#main"
      onClick={handleClick}
      className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      Bỏ qua tới nội dung chính
    </a>
  )
}
