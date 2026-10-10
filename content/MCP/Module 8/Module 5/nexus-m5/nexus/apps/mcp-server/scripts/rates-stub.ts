// Dịch vụ tỷ giá giả lập cho dev/smoke (M3 · S3.4): node scripts/rates-stub.ts [port]
import { createServer } from "node:http";

const RATES: Record<string, number> = { USD: 26_150, EUR: 30_420, JPY: 176.4, SGD: 20_310 };
const port = Number(process.argv[2] ?? 4010);
createServer((req, res) => {
  const m = /^\/rates\/([A-Z]{3})$/.exec(req.url ?? "");
  const rate = m?.[1] ? RATES[m[1]] : undefined;
  res.setHeader("content-type", "application/json");
  if (rate === undefined) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "unknown currency" }));
    return;
  }
  res.end(JSON.stringify({ rate, asOf: new Date().toISOString() }));
}).listen(port, "127.0.0.1", () => process.stderr.write(`rates-stub :${port}\n`));
