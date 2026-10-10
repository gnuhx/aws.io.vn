/** Dữ liệu giả cho giao diện tĩnh. Từ M2/M10 những thứ này đến từ MongoDB. */

export type Customer = { id: string; name: string; city: string; orders: number; revenue: number }

export const topCustomers: Customer[] = [
  { id: 'c1', name: 'Cà phê Phố Cổ', city: 'Hà Nội', orders: 48, revenue: 182_400_000 },
  { id: 'c2', name: 'Sông Hàn Roastery', city: 'Đà Nẵng', orders: 41, revenue: 156_900_000 },
  { id: 'c3', name: 'Mộc Coffee', city: 'Hà Nội', orders: 37, revenue: 131_200_000 },
  { id: 'c4', name: 'Sài Gòn Brew', city: 'TP.HCM', orders: 33, revenue: 118_500_000 },
  { id: 'c5', name: 'Đà Lạt Farm', city: 'Lâm Đồng', orders: 29, revenue: 97_300_000 },
]

export const revenueByMonth = [
  { month: 'T4', value: 412 },
  { month: 'T5', value: 455 },
  { month: 'T6', value: 431 },
  { month: 'T7', value: 498 },
  { month: 'T8', value: 537 },
  { month: 'T9', value: 569 },
] // triệu đồng

export const stats = [
  { label: 'Khách hàng', value: '1.284', change: '+3,2% so với tháng trước' },
  { label: 'Hội thoại tuần này', value: '342', change: '+12% so với tuần trước' },
  { label: 'Tool call', value: '2.910', change: '98,7% thành công' },
]

export const recentToolCalls = [
  { id: 't1', tool: 'nexus_list_customers', when: '2 phút trước', ok: true },
  { id: 't2', tool: 'nexus_revenue_by', when: '15 phút trước', ok: true },
  { id: 't3', tool: 'nexus_get_customer', when: '1 giờ trước', ok: false },
]

export const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
