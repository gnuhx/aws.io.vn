import type { City, Customer, CustomerId, Tier } from "@nexus/shared";

/** 30 khách mẫu dùng chung cho RAM và seed Mongo (M2 · S2.2): 12 ở Hà Nội. */
const ROWS: ReadonlyArray<readonly [string, City, Tier]> = [
  ["Công ty Sao Mai", "Hà Nội", "pro"],
  ["Nhà sách Trí Tuệ", "Hà Nội", "free"],
  ["Bánh mì Hội An Xưa", "Đà Nẵng", "free"],
  ["Logistics Cảng Xanh", "Hải Phòng", "enterprise"],
  ["Studio Gỗ Mộc", "Hà Nội", "pro"],
  ["Phòng khám An Tâm", "TP.HCM", "pro"],
  ["Trà Thái Nguyên", "Hà Nội", "free"],
  ["Điện máy Phương Nam", "Cần Thơ", "enterprise"],
  ["Gốm Bát Tràng", "Hà Nội", "pro"],
  ["Du lịch Biển Xanh", "Đà Nẵng", "pro"],
  ["Nội thất Minh Long", "TP.HCM", "enterprise"],
  ["Thời trang Áo Dài Việt", "Hà Nội", "free"],
  ["May mặc Hưng Thịnh", "Hải Phòng", "pro"],
  ["Nông sản Miệt Vườn", "Cần Thơ", "free"],
  ["Học viện Lập Trình", "Hà Nội", "enterprise"],
  ["Spa Hoa Sen", "TP.HCM", "free"],
  ["Xây dựng Đông Á", "Hà Nội", "enterprise"],
  ["Khách sạn Sông Hàn", "Đà Nẵng", "enterprise"],
  ["Cà phê Phố Cổ", "Hà Nội", "pro"],
  ["Cà phê Vợt Chợ Lớn", "TP.HCM", "free"],
  ["Thủy sản Cửu Long", "Cần Thơ", "pro"],
  ["Vận tải Bắc Nam", "Hà Nội", "pro"],
  ["Phần mềm Mây Trắng", "TP.HCM", "enterprise"],
  ["Hải sản Đồ Sơn", "Hải Phòng", "free"],
  ["Mỹ phẩm Thiên Nhiên", "TP.HCM", "pro"],
  ["In ấn Ánh Dương", "Hà Nội", "free"],
  ["Gạo Sóc Trăng", "Cần Thơ", "free"],
  ["Kiến trúc Không Gian", "Đà Nẵng", "pro"],
  ["Sữa chua Ba Vì", "Hà Nội", "free"],
  ["Thiết bị Y tế Bình An", "TP.HCM", "enterprise"],
];

const slug = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export function seedCustomers(extra = 0): Customer[] {
  const out: Customer[] = ROWS.map(([name, city, tier], i) => ({
    id: `cus_${String(i + 1).padStart(3, "0")}` as CustomerId,
    name,
    email: `lienhe@${slug(name)}.vn`,
    city,
    tier,
    createdAt: new Date(Date.UTC(2025, 0, 1 + i * 7)).toISOString(),
  }));
  // Khách giả lập để đo kích thước kết quả (M4 · S4.5)
  for (let i = 0; i < extra; i++) {
    const n = ROWS.length + i + 1;
    out.push({
      id: `cus_${String(n).padStart(3, "0")}` as CustomerId,
      name: `Khách thử nghiệm ${String(n).padStart(3, "0")}`,
      email: `khach${n}@thunghiem.vn`,
      city: (["Hà Nội", "TP.HCM", "Đà Nẵng"] as const)[n % 3] ?? "Hà Nội",
      tier: "free",
      createdAt: new Date(Date.UTC(2026, 0, 1 + (n % 200))).toISOString(),
    });
  }
  return out;
}
