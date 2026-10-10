// Bẫy S7.3 — mở CORS "*" cho web client/Inspector chạy được, quên kiểm Origin.
// Mô phỏng đúng thứ trình duyệt làm với fetch JSON chéo origin: preflight OPTIONS trước, có được phép mới gửi POST.
import express from "express";
import { createApp } from "../src/app.ts";
import { createMemoryStore } from "../src/store.ts";

const EVIL = "https://evil.example";
const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "nexus_create_task", arguments: { title: "việc do trang lạ tạo", owner: "lan" } } });

async function browser(port: number) {
  const pre = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "OPTIONS",
    headers: { origin: EVIL, "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
  });
  const allowed = pre.headers.get("access-control-allow-origin");
  if (!pre.ok || (allowed !== "*" && allowed !== EVIL)) return `preflight ${pre.status} (ACAO: ${allowed ?? "không có"}) → trình duyệt KHÔNG gửi POST`;
  const r = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { origin: EVIL, "content-type": "application/json", accept: "application/json, text/event-stream" },
    body,
  });
  const text = await r.text();
  return `preflight ${pre.status} (ACAO: ${allowed}) → POST ${r.status} ${text.includes("việc do trang lạ tạo") ? "→ tool ĐÃ CHẠY, task được tạo" : text.slice(0, 70)}`;
}

const permissiveCors: express.RequestHandler = (req, res, next) => {
  res.set({ "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS" });
  if (req.method === "OPTIONS") return void res.sendStatus(204);
  next();
};

const cases = [
  { label: "không CORS, không guard      ", cors: false, guard: false },
  { label: "CORS *, không guard          ", cors: true, guard: false },
  { label: "CORS *, có guard Host/Origin ", cors: true, guard: true },
];
let port = 3920;
for (const c of cases) {
  const outer = express();
  if (c.cors) outer.use(permissiveCors);
  const { app } = createApp({
    mode: "stateless", store: createMemoryStore(), instance: "x",
    ...(c.guard ? { guard: { allowedHosts: ["127.0.0.1", "localhost"], allowedOrigins: ["http://localhost:5173"] } } : {}),
  });
  outer.use(app);
  const h = outer.listen(++port, "127.0.0.1");
  console.log(`${c.label} ${await browser(port)}`);
  if (!c.cors && !c.guard) {
    // fetch không đặt content-type = text/plain = "request đơn giản": trình duyệt gửi THẲNG, không preflight.
    const simple = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers: { origin: EVIL, accept: "application/json, text/event-stream" }, body });
    console.log(`${"  └ request đơn giản (text/plain)".padEnd(30)} không preflight → POST ${simple.status} ${/"message":"([^"]*)"/.exec(await simple.text())?.[1] ?? ""}`);
  }
  h.close();
}
