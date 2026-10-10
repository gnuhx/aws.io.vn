// Bẫy S7.3 — kiểm Origin bằng so chuỗi con, kiểu `origin.Contains("localhost")`.
import { originOf } from "../src/http/guard.ts";

const naive = (origin: string) => origin.includes("localhost") || origin.startsWith("http://127.0.0.1");
const exact = (origin: string) => originOf(origin) === "http://localhost:5173";
for (const o of ["http://localhost:5173", "http://localhost.evil.example", "https://evil.example/?x=localhost", "http://127.0.0.1.nip.io", "http://localhost:5173.evil.example"]) {
  console.log(`${o.padEnd(36)} so chuỗi con: ${naive(o) ? "CHO QUA" : "chặn   "} · so tuyệt đối: ${exact(o) ? "cho qua" : "chặn"}`);
}
