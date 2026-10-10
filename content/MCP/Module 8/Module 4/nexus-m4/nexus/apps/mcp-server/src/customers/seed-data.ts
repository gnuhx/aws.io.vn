import type { City, Customer, Tier } from "@nexus/shared";

// 30 khách mẫu: Hà Nội 12, Hải Phòng 5, TP.HCM 5, Đà Nẵng 4, Cần Thơ 4.
const ROWS: ReadonlyArray<readonly [string, City, Tier]> = [
  ["Cà phê Phố Cổ", "Hà Nội", "pro"],
  ["Gốm Bát Tràng Minh Long", "Hà Nội", "free"],
  ["Logistics Sông Hồng", "Hà Nội", "enterprise"],
  ["Nhà sách Tràng Tiền", "Hà Nội", "free"],
  ["Dệt may Thành Công", "Hà Nội", "pro"],
  ["Phần mềm Tây Hồ", "Hà Nội", "enterprise"],
  ["In ấn Hồng Hà", "Hà Nội", "pro"],
  ["Nội thất Hòa Phát Xinh", "Hà Nội", "free"],
  ["Bánh cuốn Thanh Trì", "Hà Nội", "free"],
  ["Du lịch Hồ Gươm", "Hà Nội", "pro"],
  ["Kiến trúc Long Biên", "Hà Nội", "free"],
  ["Thực phẩm sạch Ba Vì", "Hà Nội", "pro"],
  ["Cảng biển Đình Vũ", "Hải Phòng", "enterprise"],
  ["Bánh đa cua Lê Chân", "Hải Phòng", "free"],
  ["Xi măng Chinh Phong", "Hải Phòng", "pro"],
  ["Vận tải Cát Bi", "Hải Phòng", "free"],
  ["Đóng tàu Bạch Đằng", "Hải Phòng", "enterprise"],
  ["Thời trang Bến Thành", "TP.HCM", "pro"],
  ["Fintech Sài Gòn", "TP.HCM", "enterprise"],
  ["Cà phê Vợt Chợ Lớn", "TP.HCM", "free"],
  ["Điện máy Quận 1", "TP.HCM", "pro"],
  ["Nha khoa Thủ Đức", "TP.HCM", "free"],
  ["Resort Sơn Trà", "Đà Nẵng", "enterprise"],
  ["Mì Quảng Hải Châu", "Đà Nẵng", "free"],
  ["Studio Cầu Rồng", "Đà Nẵng", "pro"],
  ["Hải sản Mỹ Khê", "Đà Nẵng", "free"],
  ["Trái cây Cái Răng", "Cần Thơ", "pro"],
  ["Gạo Ninh Kiều", "Cần Thơ", "enterprise"],
  ["Du thuyền Sông Hậu", "Cần Thơ", "free"],
  ["Bánh pía Bình Thủy", "Cần Thơ", "free"],
];

export const SEED_CUSTOMERS: readonly Customer[] = ROWS.map(([name, city, tier], i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: `cus_${n}`,
    name,
    city,
    tier,
    email: `lienhe@kh${n}.vn`,
    createdAt: new Date(Date.UTC(2025, 0, 6 + i * 9)).toISOString(),
  };
});
