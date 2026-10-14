/**
 * In từng event NDJSON của /api/chat kèm mốc thời gian — kiểm stream có thật sự "chảy".
 *   node scripts/chat-probe.ts http://localhost:3000 "Có bao nhiêu khách hàng ở Hà Nội?"
 */
import { readNdjson } from "../lib/chat/read-ndjson.ts";

const base = process.argv[2] ?? "http://localhost:3000";
const message = process.argv[3] ?? "Có bao nhiêu khách hàng ở Hà Nội?";
const t0 = performance.now();
const res = await fetch(new URL("/api/chat", base), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message }),
});
console.log(`HTTP ${res.status} ${res.headers.get("content-type") ?? ""}`);
if (!res.body) process.exit(1);
let answer = "";
for await (const ev of readNdjson(res.body)) {
  const ms = String(Math.round(performance.now() - t0)).padStart(5);
  if (ev.type === "text") answer += ev.delta;
  console.log(`${ms} ms  ${JSON.stringify(ev)}`);
}
console.log(`answer: ${answer.trim()}`);
