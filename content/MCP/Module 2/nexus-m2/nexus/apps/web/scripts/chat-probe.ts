/**
 * Gửi 1 câu hỏi tới /api/chat, in từng event kèm thời điểm nhận (ms).
 * Dùng để kiểm AC "stream theo token" — cả khi chạy thẳng lẫn khi đi qua Nginx.
 *   node scripts/chat-probe.ts http://localhost:3000 "Có bao nhiêu khách hàng ở Hà Nội?"
 */
import { readNdjson } from "../lib/chat/read-ndjson.ts";

const [base = "http://localhost:3000", question = "Có bao nhiêu khách hàng ở Hà Nội?"] = process.argv.slice(2);
const t0 = performance.now();
const res = await fetch(`${base}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: question }),
});
console.log(`HTTP ${res.status} ${res.headers.get("content-type")}`);
if (!res.body) throw new Error("không có body");

let answer = "";
for await (const ev of readNdjson(res.body)) {
  const ms = String(Math.round(performance.now() - t0)).padStart(5);
  if (ev.type === "text") answer += ev.delta;
  console.log(`${ms} ms  ${JSON.stringify(ev)}`);
}
console.log(`\ncâu trả lời: ${answer.trim()}`);
