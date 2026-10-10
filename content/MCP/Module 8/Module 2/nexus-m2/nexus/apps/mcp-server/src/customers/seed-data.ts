import { CITIES, type City, type Customer } from "@nexus/shared";

const NAMES = [
  "Cà Phê Mộc", "Gốm Bát Tràng Xanh", "Logistics Sông Hồng", "Nông Sản Tây Nguyên", "In Ấn Phương Nam",
  "Dệt May Thành Công", "Nội Thất Gỗ Việt", "Thép Hòa Bình", "Du Lịch Biển Xanh", "Phần Mềm Sao Mai",
  "Thực Phẩm Sạch Ba Vì", "Điện Máy Kim Long", "Vận Tải Bắc Nam", "Nhựa An Phát", "Dược Phẩm Hà Tây",
  "Giáo Dục Tuổi Trẻ", "Kiến Trúc Mây", "Hải Sản Cát Bà", "Trà Thái Nguyên Xanh", "Bao Bì Đông Á",
  "Xây Dựng Trường Sơn", "Tư Vấn Minh Khang", "Mỹ Phẩm Hoa Sen", "Cơ Khí Đại Việt", "Nước Mắm Phú Quốc",
  "Sách Cổ Hàng Bông", "Điện Mặt Trời Ninh Thuận", "Bánh Kẹo Tràng An", "Thời Trang Lụa Hà Đông", "Gạo Sóc Trăng",
] as const;

// Phân bố cố định để câu hỏi "có bao nhiêu khách ở Hà Nội" có đáp án kiểm được.
const CITY_PLAN: readonly City[] = NAMES.map((_, i): City => {
  if (i % 3 === 0 || i === 1 || i === 29) return "Hà Nội";
  return CITIES[1 + (i % 4)] ?? "TP.HCM";
});

const TIERS = ["free", "pro", "enterprise"] as const;

export const SEED_CUSTOMERS: readonly Customer[] = NAMES.map((name, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    id: `cus_${n}`,
    name,
    email: `contact+${n}@example.vn`,
    city: CITY_PLAN[i] ?? "Hà Nội",
    tier: TIERS[i % TIERS.length] ?? "free",
    createdAt: new Date(Date.UTC(2026, 0, 1 + i * 7)).toISOString(),
  };
});
