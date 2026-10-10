/**
 * Server tỷ giá GIẢ cho dev/test — cùng hợp đồng open.er-api.com v6, số liệu cố định (KHÔNG phải tỷ giá thật).
 * Chế độ nằm trong đường dẫn để 1 server phục vụ mọi kịch bản:
 *   http://127.0.0.1:4010/ok/v6        trả dữ liệu
 *   http://127.0.0.1:4010/slow/v6      treo 30 giây (thử timeout)
 *   http://127.0.0.1:4010/down/v6      503
 *   http://127.0.0.1:4010/html/v6      200 nhưng body là HTML (proxy/captive portal)
 *   node scripts/rates-stub.ts [port]
 */
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const STUB_RATES_USD: Record<string, number> = { USD: 1, VND: 26_000, EUR: 0.9, JPY: 150, SGD: 1.3 };

function ratesFor(base: string): Record<string, number> | undefined {
  const perUsd = STUB_RATES_USD[base];
  if (perUsd === undefined) return undefined;
  return Object.fromEntries(Object.entries(STUB_RATES_USD).map(([k, v]) => [k, Number((v / perUsd).toPrecision(6))]));
}

const server = createServer((req, res) => {
  const m = /^\/(ok|slow|down|html)\/v6\/latest\/([A-Za-z]+)$/.exec(req.url ?? "");
  if (!m) { res.writeHead(404).end(); return; }
  const [, mode, code = ""] = m;
  process.stderr.write(`[rates-stub] ${mode} ${code}\n`);
  if (mode === "slow") { setTimeout(() => res.writeHead(200).end("{}"), 30_000); return; }
  if (mode === "down") { res.writeHead(503, { "content-type": "text/plain" }).end("Service Unavailable"); return; }
  if (mode === "html") { res.writeHead(200, { "content-type": "text/html" }).end("<html><body>Please sign in to Wi-Fi</body></html>"); return; }
  const rates = ratesFor(code.toUpperCase());
  const body = rates
    ? { result: "success", base_code: code.toUpperCase(), time_last_update_utc: "Sun, 27 Sep 2026 00:02:31 +0000", rates }
    : { result: "error", "error-type": "unsupported-code" };
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
});
server.listen(port, "127.0.0.1", () => process.stderr.write(`[rates-stub] http://127.0.0.1:${port}/{ok|slow|down|html}/v6\n`));
