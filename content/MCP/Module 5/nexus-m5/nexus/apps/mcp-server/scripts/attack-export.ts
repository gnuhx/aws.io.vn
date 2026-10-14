// node scripts/attack-export.ts — tự tấn công server Nexus thật (stdio) bằng path traversal. Thoát 1 nếu có gì lọt.
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { TOOL } from "@nexus/shared";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { connect } from "./client.ts";

// Bãi thử: <tmp>/exports là thư mục cho phép; mọi thứ khác là "bí mật"
const base = await mkdtemp(path.join(tmpdir(), "nexus-attack-"));
const root = path.join(base, "exports");
await mkdir(path.join(root, "2026-09"), { recursive: true });
await mkdir(path.join(base, "exports-evil"));
await writeFile(path.join(root, "2026-09", "doanh-thu.csv"), "thang,doanh_thu\n2026-09,1250000000\n");
await writeFile(path.join(root, "bao-cao.md"), "# Báo cáo tuần\n");
await writeFile(path.join(base, "exports-evil", "secret.txt"), "BI_MAT: thư mục anh em cùng tiền tố\n");
await writeFile(path.join(base, "secret.env"), "MONGO_URI=mongodb://admin:hunter2@db:27017\n");
await symlink(path.join(base, "secret.env"), path.join(root, "link-secret.txt")); // file symlink ra ngoài
await symlink("/etc", path.join(root, "linkdir")); // thư mục symlink ra ngoài
await symlink(path.join(base, "secret.env"), path.join(root, "khach.csv")); // bẫy cho lệnh GHI

const LEAK = /root:x:0|BI_MAT|hunter2/;
const client = await connect({ NEXUS_EXPORT_DIR: root });

async function call(name: string, args: Record<string, unknown>): Promise<{ text: string; how: string }> {
  try {
    const r = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const text = r.content.map((c) => (c.type === "text" ? c.text : "")).join(" ");
    const how = r.isError ? (text.includes("-32602") ? "-32602 schema" : "isError") : "ĐỌC ĐƯỢC";
    return { text, how };
  } catch (err) {
    return { text: String(err), how: "protocol error" };
  }
}

const READS: Array<[string, string]> = [
  ["cổ điển", "../../../../../../etc/passwd"],
  ["tuyệt đối", "/etc/passwd"],
  ["mã hóa %2F", "..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd"],
  ["mã hóa %2e", "%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"],
  ["mã hóa 2 lần", "..%252f..%252fetc%252fpasswd"],
  ["....//", "....//....//etc/passwd"],
  ["backslash", "..\\..\\secret.env"],
  ["đi vào rồi ra", "2026-09/../../secret.env"],
  ["thư mục anh em", "../exports-evil/secret.txt"],
  ["NUL byte", "bao-cao.md\u0000.png"],
  ["symlink file", "link-secret.txt"],
  ["symlink thư mục", "linkdir/passwd"],
];

let leaked = 0;
console.log(`thư mục cho phép: <tmp>/exports · ${READS.length} kiểu tấn công đọc + 2 kiểu tấn công ghi\n`);
for (const [label, p] of READS) {
  const { text, how } = await call(TOOL.readExport, { path: p });
  const bad = LEAK.test(text);
  if (bad) leaked++;
  console.log(`${bad ? "✗ LỌT " : "✓ chặn"}  ${label.padEnd(16)} ${JSON.stringify(p).padEnd(48)} → ${how}`);
}

// Ghi: tên file có ../ và ghi đè qua symlink có sẵn
const before = await readFile(path.join(base, "secret.env"), "utf8");
for (const [label, args] of [
  ["ghi ra ngoài", { filename: "../../tmp/x.csv" }],
  ["ghi đè symlink", { filename: "khach.csv", overwrite: true }],
] as const) {
  const { how, text } = await call(TOOL.exportCustomers, args);
  console.log(`✓ chặn  ${label.padEnd(16)} ${JSON.stringify(args).padEnd(48)} → ${how}${how === "isError" ? `: ${text.slice(0, 60)}` : ""}`);
}
const after = await readFile(path.join(base, "secret.env"), "utf8");
if (after !== before) leaked++;
console.log(`${after === before ? "✓" : "✗"} secret.env không bị ghi đè`);

const ok = await call(TOOL.readExport, { path: "2026-09/doanh-thu.csv" });
console.log(`✓ hợp lệ  ${"đường thường".padEnd(16)} ${JSON.stringify("2026-09/doanh-thu.csv").padEnd(48)} → ${ok.how}: ${JSON.stringify(JSON.parse(ok.text).text)}`);

await client.close();
console.log(`\n${leaked === 0 ? "OK: 0 lọt" : `${leaked} LỌT`}`);
process.exit(leaked === 0 ? 0 : 1);
