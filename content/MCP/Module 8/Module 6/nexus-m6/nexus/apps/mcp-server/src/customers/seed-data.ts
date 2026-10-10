import { CustomerSchema, type Customer } from "@nexus/shared";

type Row = [name: string, city: Customer["city"], tier: Customer["tier"], industry: Customer["industry"], address: string, note: string];

/** 30 khách cố định. cus_026–cus_030 nhập từ file Excel cũ: thiếu city/industry, chỉ còn địa chỉ + ghi chú tự do (S6.2). */
const ROWS: Row[] = [
  ["Cà phê Phố Cổ", "Hà Nội", "pro", "cafe", "15 Hàng Bạc, Hoàn Kiếm", "chuỗi 4 quán"],
  ["Sài Gòn Roastery", "TP.HCM", "enterprise", "manufacturing", "120 Võ Văn Tần, Q.3", "xưởng rang"],
  ["Biển Xanh Café", "Đà Nẵng", "free", "cafe", "22 Bạch Đằng, Hải Châu", ""],
  ["Hải Cảng Logistics", "Hải Phòng", "pro", "logistics", "8 Lạch Tray, Ngô Quyền", "kho lạnh"],
  ["Mekong Coffee Co.", "Cần Thơ", "pro", "retail", "45 Hai Bà Trưng, Ninh Kiều", ""],
  ["Hồ Tây Books & Coffee", "Hà Nội", "free", "retail", "9 Quảng An, Tây Hồ", ""],
  ["Bến Thành Trading", "TP.HCM", "enterprise", "retail", "2 Lê Lợi, Q.1", "nhà phân phối"],
  ["Nexa Academy", "Hà Nội", "pro", "education", "36 Trần Đại Nghĩa, Hai Bà Trưng", "đào tạo barista"],
  ["Sơn Trà Resort", "Đà Nẵng", "enterprise", "retail", "Sơn Trà", "khách sạn 5 sao"],
  ["Cảng Đình Vũ Café", "Hải Phòng", "free", "cafe", "KCN Đình Vũ", ""],
  ["Gạo Tây Đô", "Cần Thơ", "free", "retail", "Cái Răng", ""],
  ["Long Biên Express", "Hà Nội", "enterprise", "logistics", "Ngọc Thụy, Long Biên", "giao nội thành"],
  ["Thảo Điền Brew Lab", "TP.HCM", "pro", "cafe", "Thảo Điền, TP Thủ Đức", ""],
  ["Hàn Giang Tech", "Đà Nẵng", "pro", "software", "Hải Châu", "phần mềm POS"],
  ["Đồ Sơn Seafood", "Hải Phòng", "free", "retail", "Đồ Sơn", ""],
  ["Ninh Kiều Roasters", "Cần Thơ", "pro", "manufacturing", "Ninh Kiều", ""],
  ["Cầu Giấy Coworking", "Hà Nội", "pro", "software", "Duy Tân, Cầu Giấy", ""],
  ["Q7 Kitchen Supply", "TP.HCM", "free", "retail", "Phú Mỹ Hưng, Q.7", ""],
  ["Ngũ Hành Sơn Stone", "Đà Nẵng", "free", "manufacturing", "Ngũ Hành Sơn", ""],
  ["Tràng An Barista School", "Hà Nội", "enterprise", "education", "Ba Đình", ""],
  ["Chợ Lớn Wholesale", "TP.HCM", "pro", "retail", "Q.5", ""],
  ["Lạch Tray Sports Café", "Hải Phòng", "pro", "cafe", "Lạch Tray", ""],
  ["Phong Điền Farm", "Cần Thơ", "free", "manufacturing", "Phong Điền", ""],
  ["Mỹ Đình Office Coffee", "Hà Nội", "free", "cafe", "Mỹ Đình, Nam Từ Liêm", ""],
  ["Landmark Café", "TP.HCM", "enterprise", "cafe", "Bình Thạnh", ""],
  // nhập từ file cũ — thiếu city / industry
  ["Quán Gió Bấc", null, "free", null, "số 7 ngõ 12 Phan Đình Phùng, Ba Đình, HN", "bán cà phê muối và bánh mì sáng"],
  ["Cty TNHH Vận tải Sông Hàn", null, "pro", null, "Lô 3 đường Ngô Quyền, Sơn Trà, DN", "xe tải giao hàng liên tỉnh"],
  ["Trung tâm Anh ngữ Bến Nghé", null, "pro", null, "88 Nguyễn Huệ, Q1, tp hcm", "dạy tiếng Anh cho trẻ em"],
  ["Tạp hóa Cô Ba", null, "free", null, "chợ Xuân Khánh, Ninh Kiều", "bán lẻ đồ khô, cà phê gói"],
  ["Studio Phần Mềm Lá Chắn", null, "enterprise", null, "tầng 9, 21 Lê Văn Lương, Thanh Xuân", "viết app quản lý kho"],
];

export const SEED_CUSTOMERS: readonly Customer[] = ROWS.map(([name, city, tier, industry, address, note], i) => {
  const n = String(i + 1).padStart(3, "0");
  return CustomerSchema.parse({ id: `cus_${n}`, name, city, tier, industry, address, note, email: `lienhe+${n}@nexus.example` });
});
