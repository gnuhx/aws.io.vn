// S7.3 — Origin/Host: request trình duyệt gửi khi bị DNS rebinding, và bind 127.0.0.1.
import { networkInterfaces } from "node:os";
import { spawnSync } from "node:child_process";
import { ACCEPT_BOTH, check, initBody, raw, ROOT, startServer, summary } from "./lib.ts";

const PORT = "3301";
const srv = await startServer({ MODE: "stateless", PORT, INSTANCE: "G", ALLOWED_ORIGINS: "http://localhost:5173" });
const URL_ = `http://127.0.0.1:${PORT}/mcp`;

const cases: { label: string; headers: Record<string, string>; want: number }[] = [
  { label: "CLI/Claude Desktop (không Origin)", headers: { host: `127.0.0.1:${PORT}` }, want: 200 },
  { label: "web app được phép", headers: { host: `localhost:${PORT}`, origin: "http://localhost:5173" }, want: 200 },
  { label: "trang lạ gọi thẳng", headers: { host: `127.0.0.1:${PORT}`, origin: "https://evil.example" }, want: 403 },
  { label: "origin giả dạng tiền tố", headers: { host: `127.0.0.1:${PORT}`, origin: "http://localhost:5173.evil.example" }, want: 403 },
  { label: "sai cổng", headers: { host: `127.0.0.1:${PORT}`, origin: "http://localhost:5174" }, want: 403 },
  { label: "origin null (iframe sandbox, file://)", headers: { host: `127.0.0.1:${PORT}`, origin: "null" }, want: 403 },
  { label: "DNS rebinding: Host của kẻ tấn công", headers: { host: `rebind.attacker.example:${PORT}`, origin: `http://rebind.attacker.example:${PORT}` }, want: 403 },
  { label: "rebinding, trình duyệt cũ không gửi Origin", headers: { host: `rebind.attacker.example:${PORT}` }, want: 403 },
  { label: "Host 127.0.0.1.nip.io", headers: { host: `127.0.0.1.nip.io:${PORT}` }, want: 403 },
];
for (const k of cases) {
  const r = await raw(URL_, { body: initBody(), headers: { ...ACCEPT_BOTH, ...k.headers } });
  const why = r.status === 403 ? (JSON.parse(r.body) as { error: { message: string } }).error.message : "";
  check(r.status === k.want, `${r.status} ${k.label.padEnd(42)}`, why);
}

console.log("\n— Bind 127.0.0.1: gọi từ IP khác của máy —");
const ip = Object.values(networkInterfaces()).flat().find((n) => n && n.family === "IPv4" && !n.internal)?.address;
if (ip) {
  const r = await raw(`http://${ip}:${PORT}/mcp`, { body: initBody(), headers: ACCEPT_BOTH }).catch((e: unknown) => e);
  const code = r instanceof Error && "code" in r ? String(r.code) : "đến được (!)";
  console.log(`http://${ip}:${PORT}/mcp → ${code}`);
  check(code === "ECONNREFUSED", "máy khác trong mạng không chạm tới được");
}
await srv.stop();

console.log("\n— Từ chối khởi động: 0.0.0.0 mà không bật auth —");
const bad = spawnSync(process.execPath, ["src/main.ts"], { cwd: ROOT, env: { PATH: process.env["PATH"] ?? "", HOST: "0.0.0.0", PORT: "3302" }, encoding: "utf8", timeout: 5000 });
console.log(`exit=${bad.status} · ${bad.stderr.trim()}`);
check(bad.status === 1, "fail fast thay vì mở tool cho cả mạng");
summary("S7.3");
