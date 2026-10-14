// node scripts/seed-exports.ts — tạo vài file "kế toán tải lên" trong thư mục export để thử S5.1/S5.4.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedCustomers } from "../src/customers/seed-data.ts";
import { loadEnv } from "../src/env.ts";
import { seedOrders } from "../src/orders/seed-data.ts";
import { vnMonth } from "../src/orders/repository.ts";

const dir = loadEnv().NEXUS_EXPORT_DIR;
const customers = seedCustomers();
const byId = new Map<string, string>(customers.map((c) => [c.id, c.name]));
const orders = seedOrders(customers);
const NOTES = ["", "Gia hạn, có VAT", 'Khách nói "gấp"', "Chuyển khoản\nngày 2"];
const q = (s: string): string => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const vnd = (n: number): string => n.toLocaleString("de-DE"); // 1.250.000 — kiểu kế toán VN hay xuất

const lines = ["ma_don,khach_hang,san_pham,so_tien,trang_thai,thanh_pho,thang,ghi_chu"];
orders.forEach((o, i) => {
  const name = byId.get(o.customerId) ?? "";
  lines.push([o.id, i % 5 === 0 ? `${name}, chi nhánh 2` : name, o.product, vnd(o.amount), o.status, o.city, vnMonth(o.createdAt), NOTES[i % NOTES.length] ?? ""].map(q).join(","));
});
await mkdir(path.join(dir, "2026-09"), { recursive: true });
await writeFile(path.join(dir, "2026-09", "don-hang.csv"), `﻿${lines.join("\r\n")}\r\n`);
await writeFile(path.join(dir, "2026-09", "ghi-chu.md"), "# Ghi chú tháng 9\n\nĐã đối soát xong 600 đơn.\n");
console.log(`đã ghi ${orders.length} dòng vào ${path.relative(process.cwd(), path.join(dir, "2026-09", "don-hang.csv"))}`);
