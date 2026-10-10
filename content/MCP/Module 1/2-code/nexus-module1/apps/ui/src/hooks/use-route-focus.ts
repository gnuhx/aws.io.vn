import { useEffect, useRef } from 'react'

/**
 * Sau mỗi lần đổi trang (không phải lần tải đầu):
 *  - đặt document.title → trình đọc màn hình và tab trình duyệt biết đang ở đâu
 *  - chuyển focus vào <h1 id="page-title"> → người dùng bàn phím bắt đầu từ đầu nội dung mới
 * Cả hai chạm vào DOM ngoài cây React → effect.
 */
export function useRouteFocus(routeKey: string, title: string) {
  const prevKey = useRef(routeKey)

  useEffect(() => {
    document.title = `${title} · Nexus`
  }, [title])

  useEffect(() => {
    if (prevKey.current === routeKey) return // lần đầu (và lần chạy lại của StrictMode): không cướp focus
    prevKey.current = routeKey
    document.getElementById('page-title')?.focus()
  }, [routeKey])
}
