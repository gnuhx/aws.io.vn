// Gửi 1 câu hỏi tới /api/chat và in từng event NDJSON (kiểm tra stream + tool call từ ngoài trình duyệt).
//   node scripts/chat-probe.ts http://localhost:3100 "Có bao nhiêu khách hàng ở Hà Nội?"
export {}; // module ESM (top-level await)
const [base = "http://localhost:3000", question = "Có bao nhiêu khách hàng?"] = process.argv.slice(2);
const t0 = performance.now();
const res = await fetch(`${base}/api/chat`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
});
if (!res.ok || !res.body) {
  console.error(`HTTP ${res.status}`);
  process.exit(1);
}
let text = "";
let buf = "";
for await (const chunk of res.body.pipeThrough(new TextDecoderStream())) {
  buf += chunk;
  const lines = buf.split("\n");
  buf = lines.pop() ?? "";
  for (const line of lines.filter(Boolean)) {
    const ev = JSON.parse(line) as { type: string; delta?: string };
    if (ev.type === "text") text += ev.delta ?? "";
    else console.log(`${Math.round(performance.now() - t0)} ms  ${line}`);
  }
}
console.log(`answer: ${text.trim()}`);
