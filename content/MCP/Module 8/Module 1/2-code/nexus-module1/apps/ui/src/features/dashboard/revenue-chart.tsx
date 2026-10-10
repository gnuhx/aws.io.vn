import { useId } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { revenueByMonth } from '@/data/fake'

// viewBox nhỏ (320) → trên điện thoại SVG gần như không bị thu nhỏ, chữ 14 đơn vị hiện ≈ 12px thật
const W = 320
const H = 190
const PAD = { top: 24, right: 4, bottom: 28, left: 4 }

/**
 * Biểu đồ cột tự vẽ bằng SVG.
 * Người nhìn thấy cột; trình đọc màn hình nghe <title> + <desc> tóm tắt xu hướng;
 * ai cần số chính xác mở bảng ngay bên dưới.
 */
export function RevenueChart() {
  const id = useId()
  const max = Math.max(...revenueByMonth.map((d) => d.value))
  const first = revenueByMonth[0]
  const last = revenueByMonth[revenueByMonth.length - 1]
  const bw = (W - PAD.left - PAD.right) / revenueByMonth.length
  const scale = (v: number) => ((H - PAD.top - PAD.bottom) * v) / max

  return (
    <figure className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`} className="mx-auto h-auto w-full max-w-md">
        <title id={`${id}-t`}>Doanh thu theo tháng, triệu đồng</title>
        <desc id={`${id}-d`}>
          Tăng từ {first.value} triệu ở {first.month} lên {last.value} triệu ở {last.month}; chỉ giảm nhẹ ở T6.
        </desc>
        {revenueByMonth.map((d, i) => {
          const h = scale(d.value)
          const x = PAD.left + i * bw + bw * 0.18
          const y = H - PAD.bottom - h
          return (
            <g key={d.month}>
              <rect x={x} y={y} width={bw * 0.64} height={h} rx={4} className="fill-primary" />
              <text x={x + bw * 0.32} y={y - 6} textAnchor="middle" className="fill-foreground text-[14px] tabular-nums">
                {d.value}
              </text>
              <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[14px]">
                {d.month}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="text-sm text-muted-foreground">Đơn vị: triệu đồng. Nguồn: dữ liệu giả của giao diện tĩnh.</figcaption>

      <details className="rounded-md border px-3 py-2 text-sm">
        <summary className="cursor-pointer rounded outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          Xem số liệu dạng bảng
        </summary>
        <Table className="mt-2">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Tháng</TableHead>
              <TableHead scope="col" className="text-right">
                Doanh thu (triệu đồng)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueByMonth.map((d) => (
              <TableRow key={d.month}>
                <TableCell>{d.month}</TableCell>
                <TableCell className="text-right tabular-nums">{d.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </figure>
  )
}
