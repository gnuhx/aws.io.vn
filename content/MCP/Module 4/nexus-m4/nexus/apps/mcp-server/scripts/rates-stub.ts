// API tỷ giá GIẢ, cùng hợp đồng open.er-api.com v6. 4 chế độ theo tiền tố đường dẫn:
//   /ok/v6/latest/USD   → JSON success (số cố định, KHÔNG phải tỷ giá thật)
//   /slow/v6/...        → treo 30 s rồi trả {}
//   /down/v6/...        → 503
//   /html/v6/...        → 200 text/html (kiểu captive portal)
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1, VND: 26000, EUR: 0.92 },
  EUR: { EUR: 1, VND: 28300, USD: 1.09 },
};

createServer((req, res) => {
  const m = /^\/(ok|slow|down|html)\/v6\/latest\/([A-Za-z]+)$/.exec(req.url ?? "");
  if (!m) return void res.writeHead(404).end();
  const [, mode, base = ""] = m;
  if (mode === "down") return void res.writeHead(503).end("Service Unavailable");
  if (mode === "html") return void res.writeHead(200, { "content-type": "text/html" }).end("<html><body>Login required</body></html>");
  if (mode === "slow") return void setTimeout(() => res.writeHead(200, { "content-type": "application/json" }).end("{}"), 30_000);
  const rates = RATES[base.toUpperCase()];
  if (!rates) return void res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ result: "error", "error-type": "unsupported-code" }));
  res.writeHead(200, { "content-type": "application/json" }).end(
    JSON.stringify({ result: "success", base_code: base.toUpperCase(), time_last_update_utc: "Mon, 28 Sep 2026 00:00:01 +0000", rates }),
  );
}).listen(port, "127.0.0.1", () => process.stderr.write(`rates-stub on http://127.0.0.1:${port}\n`));
