import { CircleAlert, CircleCheck } from 'lucide-react'
import { PageTitle } from '@/components/a11y/page-title'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatVnd, recentToolCalls, stats, topCustomers } from '@/data/fake'
import type { Workspace } from '@/data/nav'
import { RevenueChart } from './revenue-chart'

export function DashboardPage({ workspace }: { workspace: Workspace }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <PageTitle>Dashboard</PageTitle>
        <p className="text-sm text-muted-foreground">Số liệu 6 tháng gần nhất của {workspace.name}.</p>
      </div>

      {/* Thứ bậc heading không nhảy cóc: h1 → h2 → h3 */}
      <section aria-labelledby="stats-h">
        <h2 id="stats-h" className="sr-only">
          Số liệu nhanh
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label}>
              <Card className="gap-1 py-4">
                <CardHeader className="px-4">
                  <h3 className="text-sm text-muted-foreground">{s.label}</h3>
                  <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.change}</p>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* grid-cols-1 = minmax(0,1fr): cho cột co lại nhỏ hơn bề rộng tối thiểu của bảng → bảng tự cuộn ngang
          bên trong khung của nó, thay vì đẩy cả trang tràn ra ngoài màn hình 360px */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Doanh thu theo tháng</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Khách hàng lớn nhất</h2>
            </CardTitle>
            <CardDescription>Xếp theo doanh thu 6 tháng.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table scrollLabel="Bảng khách hàng lớn nhất (cuộn ngang được)">
              <TableCaption className="sr-only">5 khách hàng có doanh thu cao nhất trong 6 tháng</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Khách hàng</TableHead>
                  <TableHead scope="col">Thành phố</TableHead>
                  <TableHead scope="col" className="text-right">
                    Đơn
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Doanh thu
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(c.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Tool call gần đây</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {recentToolCalls.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                {t.ok ? <CircleCheck className="size-4" aria-hidden="true" /> : <CircleAlert className="size-4 text-destructive" aria-hidden="true" />}
                <code className="text-xs">{t.tool}</code>
                {/* Kết quả nói bằng chữ, màu chỉ để nhấn mạnh */}
                <span className={t.ok ? 'text-muted-foreground' : 'font-medium text-destructive'}>{t.ok ? 'Thành công' : 'Lỗi'}</span>
                <span className="ml-auto text-muted-foreground">{t.when}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
